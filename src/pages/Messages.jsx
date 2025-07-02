import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import HeaderActions from '../components/HeaderActions';
import ChatModal from '../components/messages/ChatModal';
import ChatConversation from "../components/messages/ChatConversation";
import '../overview.css';
import '../Messages.css';

const Messages = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [activeFilter, setActiveFilter] = useState('All');
  const [isChatModalOpen, setChatModalOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messageStats, setMessageStats] = useState({
    all: 0,
    sent: 0,
    received: 0
  });
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

  // Dynamic stat data based on real message counts
  const statData = [
    {
      title: 'All Messages',
      value: messageStats.all,
      percentage: messageStats.all > 0 ? '+' + Math.round((messageStats.all / 10) * 100) / 100 + '%' : '0%',
      icon: 'card6-img.svg',
    },
    {
      title: 'Sent Messages', 
      value: messageStats.sent,
      percentage: messageStats.sent > 0 ? '+' + Math.round((messageStats.sent / 7) * 100) / 100 + '%' : '0%',
      icon: 'card3-img.svg',
    },
    {
      title: 'Received Messages',
      value: messageStats.received,
      percentage: messageStats.received > 0 ? '+' + Math.round((messageStats.received / 3) * 100) / 100 + '%' : '0%',
      icon: 'card7-img.svg',
    },
  ];

  // Fetch conversations for current user
  const fetchConversations = async () => {
    if (!currentUser || !currentHospital) {
      console.log('No current user or hospital, skipping conversation fetch');
      setConversationsLoading(false);
      return;
    }

    try {
      setConversationsLoading(true);
      console.log('Fetching conversations for user:', currentUser.uid);

      // Query conversations where the current user is a participant
      const conversationsRef = collection(db, 'hospitals', currentHospital.id, 'conversations');
      const conversationsQuery = query(
        conversationsRef,
        where('participants', 'array-contains', currentUser.uid)
        // Removed orderBy to include conversations without lastMessageTime
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversationsList = [];
      let totalSent = 0;
      let totalReceived = 0;

      for (const conversationDoc of conversationsSnapshot.docs) {
        const conversationData = conversationDoc.data();
        console.log('Processing conversation:', conversationDoc.id, conversationData);

        // Get the other participant (not the current user)
        const otherParticipantId = conversationData.participants.find(id => id !== currentUser.uid);
        
        if (!otherParticipantId) {
          console.log('No other participant found for conversation:', conversationDoc.id);
          continue;
        }

        // Fetch user details for the other participant
        const otherUser = await findUserById(otherParticipantId);
        
        if (!otherUser) {
          console.log('Could not find user details for participant:', otherParticipantId);
          continue;
        }

        // Count messages for stats
        const messagesRef = collection(db, 'hospitals', currentHospital.id, 'conversations', conversationDoc.id, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        
        let sentCount = 0;
        let receivedCount = 0;
        
        messagesSnapshot.forEach(msgDoc => {
          const msgData = msgDoc.data();
          if (msgData.senderId === currentUser.uid) {
            sentCount++;
          } else {
            receivedCount++;
          }
        });

        totalSent += sentCount;
        totalReceived += receivedCount;

        // Create conversation object
        const conversation = {
          id: conversationDoc.id,
          otherUser: otherUser,
          lastMessage: conversationData.lastMessage || '',
          lastMessageTime: conversationData.lastMessageTime || null,
          createdAt: conversationData.createdAt || null,
          unreadCount: conversationData.unreadCount?.[currentUser.uid] || 0,
          messageCount: sentCount + receivedCount
        };

        conversationsList.push(conversation);
      }

      // Update stats
      setMessageStats({
        all: totalSent + totalReceived,
        sent: totalSent,
        received: totalReceived
      });

      // Sort conversations by last message time (most recent first)
      // For conversations without messages, sort by creation time
      conversationsList.sort((a, b) => {
        // If both have lastMessageTime, sort by that
        if (a.lastMessageTime && b.lastMessageTime) {
          return b.lastMessageTime.seconds - a.lastMessageTime.seconds;
        }
        
        // If only one has lastMessageTime, prioritize it
        if (a.lastMessageTime && !b.lastMessageTime) return -1;
        if (!a.lastMessageTime && b.lastMessageTime) return 1;
        
        // If neither has lastMessageTime, sort by creation time (newest first)
        if (!a.lastMessageTime && !b.lastMessageTime) {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          // If no timestamps available, maintain existing order
          return 0;
        }
        
        return 0;
      });

      console.log('Fetched conversations:', conversationsList);
      setConversations(conversationsList);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  // Set up real-time conversation updates
  useEffect(() => {
    if (!currentUser || !currentHospital) {
      setConversations([]);
      setConversationsLoading(false);
      return;
    }

    console.log('Setting up conversations subscription for user:', currentUser.uid);
    
    // Set up real-time listener for conversations
    const conversationsRef = collection(db, 'hospitals', currentHospital.id, 'conversations');
    const conversationsQuery = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid)
      // Removed orderBy to include conversations without lastMessageTime
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        console.log('Conversations updated, count:', snapshot.size);
        // Re-fetch conversations when changes occur
        fetchConversations();
      },
      (error) => {
        console.error('Error in conversations subscription:', error);
        setConversationsLoading(false);
      }
    );

    // Initial fetch
    fetchConversations();

    return () => {
      console.log('Cleaning up conversations subscription');
      unsubscribe();
    };
  }, [currentUser, currentHospital]);

  // Find user by ID from Firebase collections - used when navigating directly to a chat URL
  const findUserById = async (id) => {
    if (!currentHospital || !id) return null;
    
    try {
      console.log('Looking for user with ID:', id);
      
      // Check if it's a Firebase Auth UID (try users collection first)
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Found user in users collection:', userData);
          return {
            id: id,
            authUid: id,
            name: userData.displayName || userData.name || 'User',
            role: userData.role || 'user',
            email: userData.email || '',
            avatar: userData.profileImageUrl || '/default-avatar.png',
            profilePic: userData.profileImageUrl || '/default-avatar.png',
            userId: id
          };
        }
      } catch (error) {
        console.log('User not found in users collection, checking hospital collections...');
      }
      
      // Check doctors collection
      const doctorsSnapshot = await getDocs(
        collection(db, 'hospitals', currentHospital.id, 'doctors')
      );
      
      for (const docSnap of doctorsSnapshot.docs) {
        const doctorData = docSnap.data();
        
        // Match by authUid or document ID
        if (doctorData.authUid === id || docSnap.id === id) {
          console.log('Found doctor:', doctorData);
          return {
            id: docSnap.id,
            authUid: doctorData.authUid || null,
            name: doctorData.name || 'Unknown Doctor',
            role: 'doctor',
            email: doctorData.email || '',
            avatar: doctorData.profileImageUrl || '/default-avatar.png',
            profilePic: doctorData.profileImageUrl || '/default-avatar.png',
            userId: doctorData.authUid || docSnap.id
          };
        }
      }
      
      // Check patients collection
      const patientsSnapshot = await getDocs(
        collection(db, 'hospitals', currentHospital.id, 'patients')
      );
      
      for (const docSnap of patientsSnapshot.docs) {
        const patientData = docSnap.data();
        
        // Match by authUid or document ID
        if (patientData.authUid === id || docSnap.id === id) {
          console.log('Found patient:', patientData);
          return {
            id: docSnap.id,
            authUid: patientData.authUid || null,
            name: patientData.name || 'Unknown Patient',
            role: 'patient',
            email: patientData.email || '',
            avatar: patientData.profileImageUrl || '/default-avatar.png',
            profilePic: patientData.profileImageUrl || '/default-avatar.png',
            userId: patientData.authUid || docSnap.id
          };
        }
      }
      
      // Check if it's the hospital admin
      if (currentHospital.adminId === id) {
        const adminDoc = await getDoc(doc(db, 'users', currentHospital.adminId));
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          console.log('Found admin:', adminData);
          return {
            id: currentHospital.adminId,
            authUid: currentHospital.adminId,
            name: adminData.displayName || adminData.name || currentHospital.adminName || 'Hospital Admin',
            role: 'admin',
            email: adminData.email || currentHospital.adminEmail,
            avatar: adminData.profileImageUrl || '/default-avatar.png',
            profilePic: adminData.profileImageUrl || '/default-avatar.png',
            userId: currentHospital.adminId
          };
        }
      }
      
      console.log('User not found in any collection');
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  };

  // Set active chat user based on URL param
  useEffect(() => {
    const loadChatUser = async () => {
      if (userId && currentHospital) {
        setLoading(true);
        const user = await findUserById(userId);
        if (user) {
          console.log('Setting active chat user:', user);
          setActiveChatUser(user);
        } else {
          console.log('User not found, redirecting to messages');
          // If user not found, redirect back to messages
          navigate('/messages');
        }
        setLoading(false);
      } else {
        setActiveChatUser(null);
        setLoading(false);
      }
    };

    loadChatUser();
  }, [userId, currentHospital, navigate]);

  // Filter conversations based on active filter
  const filteredConversations = conversations.filter(conversation => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return conversation.unreadCount > 0;
    if (activeFilter === 'Read') return conversation.unreadCount === 0;
    return true;
  });

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  return (
    <div className="overview-container">
      <Sidebar />
      {loading ? (
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
      ) : activeChatUser ? (
        <ChatConversation 
          user={activeChatUser} 
          onClose={() => navigate('/messages')} 
        />
      ) : (
        <div className="overview-content">
          <div className="overview-header header-with-back">
            <div className="back-and-title">
              <button onClick={() => navigate('/overview')} className="back-button">
                <img src="/chevleft-icon.svg" alt="Back" />
              </button>
              <h1 className="messages-title">Messages</h1>
            </div>
            <HeaderActions />
          </div>

          <div className="card-grid">
            {statData.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                percentage={card.percentage}
                icon={card.icon}
              />
            ))}
          </div>

          <div className="filter-and-new-chat-container">
            <div className="filter-buttons-container">
              {['Unread', 'Read', 'All'].map((filter) => (
                <button
                  key={filter}
                  className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => handleFilterClick(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button className="new-chat-button" onClick={() => setChatModalOpen(true)}>
              <img src="/newmess-icon.svg" alt="New Chat" className="new-chat-icon" />
              <span className="new-chat-text">Start New Chat</span>
              <span className="new-chat-text-mobile">New</span>
            </button>
          </div>

          {/* Chat Modal */}
          <ChatModal isOpen={isChatModalOpen} onClose={() => setChatModalOpen(false)} />

          <div className="chat-list-container">
            {conversationsLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '40px 0',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  display: 'inline-block', 
                  width: '30px', 
                  height: '30px', 
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '15px'
                }}></div>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#666'
              }}>
                {conversations.length === 0 ? (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}>💬</div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500' }}>No conversations yet</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
                      Start a new conversation by clicking the "Start New Chat" button above
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500' }}>
                      No {activeFilter.toLowerCase()} conversations
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
                      Try changing the filter or start a new conversation
                    </p>
                  </div>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div key={conversation.id} className="chat-list-row">
                  <div className="chat-profile">
                    {/* Show profile image if available, otherwise show colored initial */}
                    {conversation.otherUser.avatar && conversation.otherUser.avatar !== '/default-avatar.png' ? (
                      <img
                        src={conversation.otherUser.avatar}
                        alt={conversation.otherUser.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          marginRight: '12px',
                          flexShrink: 0,
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        backgroundColor: getAvatarColor(conversation.otherUser.name),
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        display: (conversation.otherUser.avatar && conversation.otherUser.avatar !== '/default-avatar.png') ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600',
                        fontFamily: 'Gilmer, sans-serif',
                        marginRight: '12px',
                        flexShrink: 0
                      }}
                    >
                      {getInitial(conversation.otherUser.name)}
                    </div>
                    <div className="chat-details">
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="chat-name">{conversation.otherUser.name}</span>
                        {conversation.unreadCount > 0 && (
                          <span style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginLeft: '8px'
                          }}>
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessageTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            {new Date(conversation.lastMessageTime.seconds * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    className="view-message-button"
                    onClick={() => navigate(`/messages/chat/${conversation.otherUser.authUid || conversation.otherUser.id}`)}
                  >
                    <span className="message-text">Message</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
