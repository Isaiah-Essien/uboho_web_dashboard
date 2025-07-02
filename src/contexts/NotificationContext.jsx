import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useHospital } from './HospitalContext';
import ToastNotification from '../components/ToastNotification';
import { playNotificationSound } from '../utils/notificationSound';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentToast, setCurrentToast] = useState(null);
  const [documentVisible, setDocumentVisible] = useState(true);
  const { currentUser } = useAuth();
  const { currentHospital } = useHospital();

  // Track document visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setDocumentVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update document title with unread count
  useEffect(() => {
    const originalTitle = 'Uboho Dashboard';
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }

    // Cleanup on unmount
    return () => {
      document.title = originalTitle;
    };
  }, [unreadCount]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    // Check for duplicate notifications before adding
    setNotifications(prev => {
      // Check if we already have a very recent notification from the same sender about the same conversation
      const duplicateExists = prev.some(existing => 
        existing.conversationId === notification.conversationId &&
        existing.senderId === notification.senderId &&
        existing.type === notification.type &&
        (Date.now() - existing.timestamp.getTime()) < 2000 // within 2 seconds
      );

      if (duplicateExists) {
        console.log('Duplicate notification detected, skipping');
        return prev; // Don't add duplicate
      }

      console.log('Adding new notification:', newNotification);
      
      // Add the notification
      const updatedNotifications = [newNotification, ...prev];
      
      // Update unread count
      setUnreadCount(currentCount => currentCount + 1);
      
      // Show toast notification for new messages
      if (notification.type === 'message') {
        // Play notification sound
        playNotificationSound();
        
        // Show toast notification if document is visible
        if (documentVisible) {
          setCurrentToast(newNotification);
        } else {
          // Show browser notification if document is not visible
          if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title || 'New Message', {
              body: notification.message,
              icon: '/Logo1.svg', // Use your app's icon
              badge: '/Logo1.svg',
              tag: `message-${notification.conversationId}-${Date.now()}`, // Unique tag to prevent duplicates
              requireInteraction: false,
              silent: false
            });

            // Close notification after 5 seconds
            setTimeout(() => {
              browserNotification.close();
            }, 5000);

            // Handle notification click
            browserNotification.onclick = () => {
              window.focus();
              browserNotification.close();
            };
          }
        }
      }
      
      return updatedNotifications;
    });
  }, [documentVisible]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Listen for new messages in conversations where the user is a participant
  useEffect(() => {
    if (!currentUser || !currentHospital) {
      return;
    }

    console.log('Setting up notification listener for user:', currentUser.uid);

    // Track all unsubscribe functions for proper cleanup
    const messageUnsubscribes = new Map();
    const processedMessages = new Set(); // Track processed messages to prevent duplicates

    // Listen for conversations where the user is a participant
    const conversationsRef = collection(db, 'hospitals', currentHospital.id, 'conversations');
    const conversationsQuery = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribeConversations = onSnapshot(
      conversationsQuery,
      (conversationsSnapshot) => {
        // Handle conversation changes (added, removed, modified)
        conversationsSnapshot.docChanges().forEach(change => {
          const conversationId = change.doc.id;
          
          if (change.type === 'added') {
            // Only set up listener for newly added conversations
            // Set up new listener for messages in this conversation
            const messagesRef = collection(db, 'hospitals', currentHospital.id, 'conversations', conversationId, 'messages');
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));

            const unsubscribeMessages = onSnapshot(
              messagesQuery,
              (messagesSnapshot) => {
                // Check for new messages (messages not sent by current user)
                messagesSnapshot.docChanges().forEach(messageChange => {
                  if (messageChange.type === 'added') {
                    const messageId = messageChange.doc.id;
                    const messageData = messageChange.doc.data();
                    
                    // Create unique key for this message to prevent duplicate notifications
                    const messageKey = `${conversationId}-${messageId}`;
                    
                    // Skip if we've already processed this message
                    if (processedMessages.has(messageKey)) {
                      return;
                    }
                    
                    // Only create notification if:
                    // 1. Message is not sent by current user
                    // 2. Message is recent (within last 30 seconds to avoid old messages on initial load)
                    const isFromOtherUser = messageData.senderId !== currentUser.uid;
                    const messageTime = messageData.timestamp?.toDate?.() || new Date();
                    const now = new Date();
                    const isRecent = (now - messageTime) < 30000; // 30 seconds
                    
                    if (isFromOtherUser && isRecent) {
                      console.log('New message notification:', messageData);
                      
                      // Mark this message as processed
                      processedMessages.add(messageKey);
                      
                      // Get sender name
                      const senderName = messageData.senderName || 'Unknown User';
                      
                      // Create notification
                      addNotification({
                        type: 'message',
                        title: 'New Message',
                        message: `New message from ${senderName}`,
                        senderName,
                        messageText: messageData.text,
                        conversationId,
                        senderId: messageData.senderId,
                        time: formatTimeAgo(messageTime)
                      });
                    } else {
                      // Still mark as processed even if we don't notify, to avoid future duplicates
                      processedMessages.add(messageKey);
                    }
                  }
                });
              },
              (error) => {
                console.error(`Error listening to messages in conversation ${conversationId}:`, error);
              }
            );

            // Store the unsubscribe function
            messageUnsubscribes.set(conversationId, unsubscribeMessages);
            
          } else if (change.type === 'removed') {
            // Clean up listener for removed conversation
            if (messageUnsubscribes.has(conversationId)) {
              messageUnsubscribes.get(conversationId)();
              messageUnsubscribes.delete(conversationId);
            }
          }
          // Note: We're not handling 'modified' type anymore to prevent duplicate listeners
        });
      },
      (error) => {
        console.error('Error listening to conversations:', error);
      }
    );

    // Cleanup function
    return () => {
      console.log('Cleaning up notification listeners');
      unsubscribeConversations();
      
      // Clean up all message listeners
      messageUnsubscribes.forEach(unsubscribe => {
        unsubscribe();
      });
      messageUnsubscribes.clear();
      processedMessages.clear();
    };
  }, [currentUser, currentHospital, addNotification]);

  // Format time ago helper
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastNotification 
        notification={currentToast} 
        onClose={() => setCurrentToast(null)} 
      />
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
