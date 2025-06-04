import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useHospital } from '../../contexts/HospitalContext';
import ProfileAvatar from '../ProfileAvatar';
import './styles/ChatModal.css';

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

const ChatModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentHospital } = useHospital();
  
  // Setup real-time subscriptions to hospital users
  useEffect(() => {
    if (!isOpen || !currentUser || !currentHospital) {
      setUsers([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('Setting up real-time subscriptions for hospital:', currentHospital.id);
    
    const unsubscribers = [];
    const hospitalUsers = new Map(); // Use Map to track users and their latest data
    
    const updateUsersList = () => {
      const usersArray = Array.from(hospitalUsers.values());
      
      // Sort users by role (doctors first, then admins, then patients) and then by name
      const sortedUsers = usersArray.sort((a, b) => {
        const roleOrder = { doctor: 1, admin: 2, patient: 3 };
        const aRoleOrder = roleOrder[a.role] || 4;
        const bRoleOrder = roleOrder[b.role] || 4;
        
        if (aRoleOrder !== bRoleOrder) {
          return aRoleOrder - bRoleOrder;
        }
        
        return a.name.localeCompare(b.name);
      });
      
      console.log('Updated hospital users list:', sortedUsers);
      setUsers(sortedUsers);
      setLoading(false);
    };
    
    // Subscribe to doctors collection
    const doctorsUnsubscribe = onSnapshot(
      collection(db, 'hospitals', currentHospital.id, 'doctors'),
      (snapshot) => {
        console.log('Doctors collection updated, size:', snapshot.size);
        
        // Remove all current doctors from the map
        Array.from(hospitalUsers.keys()).forEach(key => {
          if (key.startsWith('doctor_')) {
            hospitalUsers.delete(key);
          }
        });
        
        // Add updated doctors
        snapshot.forEach((doc) => {
          const doctorData = doc.data();
          console.log('Doctor updated:', doc.id, doctorData);
          
          const isCurrentUser = doctorData.authUid === currentUser.uid || 
                               doc.id === currentUser.uid ||
                               doctorData.email === currentUser.email;
          
          if (!isCurrentUser) {
            hospitalUsers.set(`doctor_${doc.id}`, {
              id: doc.id,
              authUid: doctorData.authUid || null,
              name: doctorData.name || 'Unknown Doctor',
              role: 'doctor',
              email: doctorData.email || '',
              avatar: doctorData.avatar || 'default-avatar.png',
              employeeId: doc.id,
              hasAuthAccount: !!doctorData.authUid,
              status: doctorData.status || 'pending'
            });
          }
        });
        
        updateUsersList();
      },
      (error) => {
        console.error('Error in doctors subscription:', error);
        setError(`Failed to load doctors: ${error.message}`);
        setLoading(false);
      }
    );
    
    unsubscribers.push(doctorsUnsubscribe);
    
    // Subscribe to patients collection
    const patientsUnsubscribe = onSnapshot(
      collection(db, 'hospitals', currentHospital.id, 'patients'),
      (snapshot) => {
        console.log('Patients collection updated, size:', snapshot.size);
        
        // Remove all current patients from the map
        Array.from(hospitalUsers.keys()).forEach(key => {
          if (key.startsWith('patient_')) {
            hospitalUsers.delete(key);
          }
        });
        
        // Add updated patients
        snapshot.forEach((doc) => {
          const patientData = doc.data();
          console.log('Patient updated:', doc.id, patientData);
          
          const isCurrentUser = patientData.authUid === currentUser.uid || 
                               doc.id === currentUser.uid ||
                               patientData.email === currentUser.email;
          
          if (!isCurrentUser) {
            hospitalUsers.set(`patient_${doc.id}`, {
              id: doc.id,
              authUid: patientData.authUid || null,
              name: patientData.name || 'Unknown Patient',
              role: 'patient',
              email: patientData.email || '',
              avatar: patientData.avatar || 'default-avatar.png',
              patientId: doc.id,
              hasAuthAccount: !!patientData.authUid
            });
          }
        });
        
        updateUsersList();
      },
      (error) => {
        console.error('Error in patients subscription:', error);
        setError(`Failed to load patients: ${error.message}`);
        setLoading(false);
      }
    );
    
    unsubscribers.push(patientsUnsubscribe);
    
    // Add hospital admin (this doesn't need real-time updates as admin rarely changes)
    const loadAdmin = async () => {
      if (currentHospital.adminId && currentHospital.adminId !== currentUser.uid) {
        try {
          const adminDoc = await getDoc(doc(db, 'users', currentHospital.adminId));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            hospitalUsers.set('admin', {
              id: currentHospital.adminId,
              authUid: currentHospital.adminId,
              name: adminData.displayName || adminData.name || currentHospital.adminName || 'Hospital Admin',
              role: 'admin',
              email: adminData.email || currentHospital.adminEmail,
              avatar: adminData.avatar || 'default-avatar.png',
              employeeId: 'ADMIN',
              hasAuthAccount: true
            });
            updateUsersList();
          }
        } catch (error) {
          console.error('Error loading admin:', error);
        }
      }
    };
    
    loadAdmin();
    
    // Cleanup subscriptions when component unmounts or dependencies change
    return () => {
      console.log('Cleaning up real-time subscriptions');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [isOpen, currentUser, currentHospital]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const safeLower = (str) => (str || '').toLowerCase();
    
    return (
      safeLower(user.name).includes(searchLower) || 
      safeLower(user.email).includes(searchLower) ||
      safeLower(user.role).includes(searchLower) ||
      safeLower(user.patientId).includes(searchLower) ||
      safeLower(user.employeeId).includes(searchLower) ||
      safeLower(user.department).includes(searchLower)
    );
  });

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close modal with ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal" ref={modalRef}>
        <div className="chat-modal-header">
          <h2 className="chat-modal-title">Start a Chat</h2>
          <button className="chat-close-button" onClick={onClose}>
            <img src="/chevleft-icon.svg" alt="Close" style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>
        
        <div className="chat-modal-divider"></div>
        
        <div className="chat-modal-search">
          <div className="chat-search-box">
            <input
              type="text"
              className="chat-search-input"
              placeholder="Search for a user..."
              value={searchTerm}
              onChange={(e) => {
                console.log('Search term changed:', e.target.value);
                console.log('Current users:', users);
                setSearchTerm(e.target.value);
              }}
            />
            <img src="/Search-icon.svg" alt="Search" className="chat-search-icon" />
          </div>
          
        </div>
        
        <div className="chat-users-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ 
                display: 'inline-block', 
                width: '20px', 
                height: '20px', 
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '10px'
              }}></div>
              <p style={{ color: '#666', margin: 0 }}>Loading hospital users...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#dc3545' }}>
              <p style={{ margin: '0 0 10px 0' }}>Error loading users:</p>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{error}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                Please close and reopen the modal to retry
              </p>
            </div>
          ) : !currentUser ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#999', margin: 0 }}>Please log in to view hospital users</p>
            </div>
          ) : !currentHospital ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#999', margin: 0 }}>No hospital associated with your account</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div>
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="chat-user-row"
                  onClick={() => {
                    if (!user.hasAuthAccount) {
                      alert('This user has not set up their account yet and cannot receive messages.');
                      return;
                    }
                    console.log('Starting chat with user:', user);
                    onClose();
                    // Use authUid for navigation if available, otherwise use id
                    const chatUserId = user.authUid || user.id;
                    navigate(`/messages/chat/${chatUserId}`);
                  }}
                >
                  <div 
                    className="chat-user-avatar"
                    style={{
                      backgroundColor: getAvatarColor(user.name),
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      fontFamily: 'Gilmer, sans-serif',
                      marginRight: '16px',
                      flexShrink: 0
                    }}
                  >
                    {getInitial(user.name)}
                  </div>
                  <div className="chat-user-info">
                    <span className="chat-user-name">
                      {user.name}
                      <span className="chat-user-role" style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: user.role === 'doctor' ? '#e8f5e8' : 
                                       user.role === 'admin' ? '#fff3cd' : '#e3f2fd',
                        color: user.role === 'doctor' ? '#155724' : 
                               user.role === 'admin' ? '#856404' : '#0c5460',
                        fontWeight: 'bold'
                      }}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      {!user.hasAuthAccount && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: '#ffeaa7',
                          color: '#d63031',
                          fontWeight: 'bold'
                        }}>
                          No Account
                        </span>
                      )}
                    </span>
                    <span className="chat-user-id" style={{ display: 'block', marginTop: '4px' }}>
                      {user.patientId && `Patient ID: ${user.patientId}`}
                      {user.employeeId && `Employee ID: ${user.employeeId}`}
                      {!user.patientId && !user.employeeId && user.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#999', margin: 0 }}>No users found matching "{searchTerm}"</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#999', margin: '0 0 10px 0' }}>No other users found in your hospital</p>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                Users will appear here once they are added to your hospital
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#999', margin: 0 }}>All users are currently filtered out</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
