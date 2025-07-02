import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useHospital } from '../../contexts/HospitalContext';
import HeaderActions from "../../components/HeaderActions";
import "../styles/ChatConversation.css";

const ChatConversation = ({ user, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { currentHospital } = useHospital();

  // Helper function to get the first initial from a name
  const getInitial = (name) => {
    if (!name) return 'U'; // Default to 'U' for Unknown User
    return name.charAt(0).toUpperCase();
  };

  // Helper function to generate a consistent color based on the name
  const getAvatarColor = (name) => {
    if (!name) return '#6c757d'; // Default gray color
    
    // Array of nice colors for avatars
    const colors = [
      '#007bff', // Blue
      '#28a745', // Green
      '#dc3545', // Red
      '#ffc107', // Yellow
      '#6f42c1', // Purple
      '#fd7e14', // Orange
      '#20c997', // Teal
      '#e83e8c', // Pink
      '#6c757d', // Gray
      '#17a2b8', // Cyan
      '#343a40', // Dark
      '#6610f2'  // Indigo
    ];
    
    // Generate a consistent index based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use absolute value and modulo to get a valid index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Create or get conversation ID
  const getOrCreateConversation = async () => {
    if (!currentUser || !currentHospital || !user) {
      console.log('Missing required data for conversation creation');
      return null;
    }

    const otherUserId = user.authId || user.userId || user.id;
    if (!otherUserId) {
      console.error("Cannot get or create conversation without the other user's ID.");
      return null;
    }

    try {
      // Create a consistent conversation ID based on participant IDs
      const participants = [currentUser.uid, otherUserId].sort();
      const conversationId = participants.join('_');
      
      console.log('Getting/creating conversation:', conversationId);
      console.log('Participants:', participants);

      const conversationRef = doc(db, 'hospitals', currentHospital.id, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        // Create new conversation - don't set lastMessage and lastMessageTime until first message
        await setDoc(conversationRef, {
          participants: participants,
          createdAt: serverTimestamp(),
          unreadCount: {
            [currentUser.uid]: 0,
            [otherUserId]: 0
          }
        });
        console.log('Created new conversation:', conversationId);
      } else {
        console.log('Found existing conversation:', conversationId);
      }

      return conversationId;
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      return null;
    }
  };

  // Load messages for the conversation
  useEffect(() => {
    if (!currentUser || !currentHospital || !user) {
      console.log('Missing required data, skipping message load');
      setMessagesLoading(false);
      return;
    }

    let unsubscribeFromMessages = () => {};

    const setupConversation = async () => {
      setMessagesLoading(true);
      
      const convId = await getOrCreateConversation();
      if (!convId) {
        console.log('Failed to get/create conversation');
        setMessagesLoading(false);
        return;
      }

      setConversationId(convId);

      const messagesRef = collection(db, 'hospitals', currentHospital.id, 'conversations', convId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

      unsubscribeFromMessages = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messagesList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || new Date()
          }));
          
          setMessages(messagesList);
          setMessagesLoading(false);

          markMessagesAsRead(convId);
        },
        (error) => {
          console.error('Error loading messages:', error);
          setMessagesLoading(false);
        }
      );
    };

    setupConversation();

    return () => {
      unsubscribeFromMessages();
    };
  }, [currentUser, currentHospital, user]);

  // Mark messages as read
  const markMessagesAsRead = async (convId) => {
    if (!convId || !currentUser || !currentHospital) return;

    try {
      const conversationRef = doc(db, 'hospitals', currentHospital.id, 'conversations', convId);
      await updateDoc(conversationRef, {
        [`unreadCount.${currentUser.uid}`]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Send a new message
  const handleSendMessage = async () => {
    if (message.trim() === '' || !conversationId || sendingMessage) return;
    
    setSendingMessage(true);
    const messageText = message.trim();

    try {
      console.log('Sending message:', messageText);
      
      // Add message to messages subcollection
      const messagesRef = collection(db, 'hospitals', currentHospital.id, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        text: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        timestamp: serverTimestamp(),
        type: 'text'
      });

      // Update conversation metadata
      const conversationRef = doc(db, 'hospitals', currentHospital.id, 'conversations', conversationId);
      const otherUserId = user.authId || user.userId || user.id;
      
      await updateDoc(conversationRef, {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: increment(1)
      });

      console.log('Message sent successfully');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '24px';
      }
      // Now clear input for new message
      setMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message if sending failed
      setMessage(messageText);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
      // Refocus and ensure input enabled
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
      }
    }
  };

  // Handle file attachment
  const handleFileAttach = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // For now, just show an alert. You can implement file upload logic here
      alert(`File selected: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\nType: ${file.type}\n\nFile attachment feature coming soon!`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea within fixed bounds
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '24px'; // Reset to initial height
      const newHeight = Math.min(textarea.scrollHeight, 80); // Max 80px height
      textarea.style.height = newHeight + 'px';
    }
  }, [message]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format date for the conversation header
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  // Group messages by date
  const messagesByDate = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (messagesLoading) {
    return (
      <div className="overview-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-content">
      <div className="overview-header header-with-back">
        <div className="back-and-title">
          <button onClick={onClose} className="back-button">
            <img src="/chevleft-icon.svg" alt="Back" />
          </button>
          <h1 className="messages-title">{user.name}</h1>
        </div>
        <HeaderActions />
      </div>

      <div className="chat-conversation-container">
        <div className="chat-history-container">
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#666'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>No messages yet</p>
              <p style={{ margin: 0, fontSize: '14px' }}>Start the conversation by sending a message below</p>
            </div>
          ) : (
            Object.entries(messagesByDate).map(([date, msgs]) => (
              <div key={date}>
                <div className="chat-date-divider">
                  <span>{formatDate(msgs[0].timestamp).split(',')[0]}</span>
                </div>
                
                {msgs.map((msg) => {
                  const isMe = msg.senderId === currentUser.uid;
                  const otherUser = isMe ? currentUser : user;
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`chat-message ${isMe ? 'sent' : 'received'}`}
                    >
                      {/* Show profile picture or avatar for non-me messages */}
                      {!isMe && (
                        <>
                          {otherUser.profileImageUrl || otherUser.avatar ? (
                            <img
                              src={otherUser.profileImageUrl || otherUser.avatar}
                              alt={otherUser.name || otherUser.displayName || 'User'}
                              className="chat-avatar"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="chat-avatar"
                            style={{
                              backgroundColor: getAvatarColor(otherUser.name || otherUser.displayName || 'User'),
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              display: (otherUser.profileImageUrl || otherUser.avatar) ? 'none' : 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '600',
                              fontFamily: 'Gilmer, sans-serif',
                              flexShrink: 0
                            }}
                          >
                            {getInitial(otherUser.name || otherUser.displayName || 'User')}
                          </div>
                        </>
                      )}
                      <div className="message-content">
                        {msg.text}
                        <div className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
          />
          <textarea autoFocus
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendingMessage}
            rows={1}
          />
          <button 
            className="chat-attach-button" 
            onClick={handleFileAttach}
            disabled={sendingMessage}
            title="Attach file"
          >
            <img 
              src="/attach.svg" 
              alt="Attach" 
            />
          </button>
          <button 
            className="chat-send-button" 
            onClick={handleSendMessage}
            disabled={sendingMessage || message.trim() === ''}
            style={{
              opacity: sendingMessage || message.trim() === '' ? 0.5 : 1,
              cursor: sendingMessage || message.trim() === '' ? 'not-allowed' : 'pointer'
            }}
          >
            {sendingMessage ? (
              <div style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <img 
                src="/send.svg" 
                alt="Send" 
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;
