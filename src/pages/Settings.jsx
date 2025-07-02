import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import ChangeAvatar from '../components/ChangeAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import getAvatarColor from '../utils/getAvatarColor';
import '../Overview.css';
import '../Patients.css';
import '../Admin.css';
import '../Settings.css';

const Settings = () => {
  const [showChangeAvatar, setShowChangeAvatar] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentHospital } = useHospital();
  
  // Handle avatar update
  const handleAvatarUpdate = (newAvatarUrl) => {
    setUserInfo(prev => ({
      ...prev,
      avatar: newAvatarUrl
    }));
  };
  
  // Fetch user information from Firebase
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!currentUser || !currentHospital) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching user info for:', currentUser.uid);
        console.log('Hospital:', currentHospital);
        
        let userData = null;
        let userRole = 'Unknown';
        let dateJoined = 'Unknown';
        
        console.log('Checking user role for:', currentUser.uid);
        console.log('Hospital admin ID:', currentHospital.adminId);
        
        // Check if user is the hospital admin
        if (currentHospital.adminId === currentUser.uid) {
          console.log('User is hospital admin');
          // User is admin - get data from users collection
          const adminDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (adminDoc.exists()) {
            userData = adminDoc.data();
            userRole = 'Admin';
            dateJoined = userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown';
            console.log('Admin data loaded:', userData);
          } else {
            console.log('Admin document not found in users collection, using auth data');
            // Admin document doesn't exist, create basic data but keep Admin role
            userData = {
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrator',
              email: currentUser.email || 'admin@hospital.com',
              avatar: currentUser.photoURL || '/profpic.svg'
            };
            userRole = 'Admin';
            dateJoined = currentUser.metadata?.creationTime ? 
              new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown';
          }
        } else {
          console.log('User is not admin, checking doctor/patient status');
          // Check if user is a doctor
          try {
            const doctorsSnapshot = await getDocs(
              query(collection(db, 'hospitals', currentHospital.id, 'doctors'), 
                    where('authUid', '==', currentUser.uid))
            );
            
            if (!doctorsSnapshot.empty) {
              userData = doctorsSnapshot.docs[0].data();
              userRole = 'Doctor';
              dateJoined = userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 
                          userData.passwordSetAt ? new Date(userData.passwordSetAt.seconds * 1000).toLocaleDateString() : 'Unknown';
              console.log('Doctor data loaded:', userData);
            } else {
              console.log('User is not a doctor, checking patient status');
              // Check if user is a patient
              const patientsSnapshot = await getDocs(
                query(collection(db, 'hospitals', currentHospital.id, 'patients'), 
                      where('authUid', '==', currentUser.uid))
              );
              
              if (!patientsSnapshot.empty) {
                userData = patientsSnapshot.docs[0].data();
                userRole = 'Patient';
                dateJoined = userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown';
                console.log('Patient data loaded:', userData);
              } else {
                console.log('User not found as doctor or patient');
              }
            }
          } catch (roleError) {
            console.error('Error checking user role:', roleError);
          }
        }
        
        // Fallback to Firebase Auth data if no Firestore data found
        if (!userData) {
          userData = {
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown User',
            email: currentUser.email || 'Unknown Email',
            // Do not reference userData.profileImageUrl here, as userData is null
            avatar: currentUser.photoURL || '/profpic.svg'
          };
          // Only set userRole to 'User' if it wasn't already determined (e.g., Admin)
          if (userRole === 'Unknown') {
            userRole = 'User';
          }
          dateJoined = currentUser.metadata?.creationTime ? 
            new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown';
        }
        
        console.log('Final user role determined:', userRole);
        console.log('Final user data:', userData);
        
        setUserInfo({
          avatar: (userData && userData.profileImageUrl) || (userData && userData.photoURL) || (userData && userData.avatar) || '/profpic.svg',
          name: (userData && (userData.name || userData.displayName)) || currentUser.displayName || 'Unknown User',
          email: (userData && userData.email) || currentUser.email || 'Unknown Email',
          hospital: currentHospital.name || 'Unknown Hospital',
          privilege: userRole,
          dateJoined: dateJoined,
          uid: currentUser.uid
        });
        
        console.log('UserInfo set with privilege:', userRole);
        
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError(`Failed to load user information: ${error.message}`);
        
        // Fallback to basic Auth data
        setUserInfo({
          avatar: '/profpic.svg',
          name: currentUser?.displayName || 'Unknown User',
          email: currentUser?.email || 'Unknown Email',
          hospital: 'Unknown Hospital',
          privilege: 'User',
          dateJoined: 'Unknown',
          uid: currentUser?.uid || 'Unknown'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserInfo();
  }, [currentUser, currentHospital]);
  
  if (loading) {
    return (
      <div className="overview-container">
        <Sidebar />
        <div className="overview-content">
          <div className="overview-header">
            <h1 className="overview-title">Settings</h1>
            <HeaderActions />
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="overview-container">
        <Sidebar />
        <div className="overview-content">
          <div className="overview-header">
            <h1 className="overview-title">Settings</h1>
            <HeaderActions />
          </div>
          <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>
            <p>Error loading user information:</p>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ 
              padding: '8px 16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!userInfo) {
    return (
      <div className="overview-container">
        <Sidebar />
        <div className="overview-content">
          <div className="overview-header">
            <h1 className="overview-title">Settings</h1>
            <HeaderActions />
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>No user information available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-container">
      <Sidebar />
      <div className="overview-content">
        {showChangeAvatar ? (
          <ChangeAvatar 
            onClose={() => setShowChangeAvatar(false)} 
            currentAvatar={userInfo.avatar}
            onAvatarUpdate={handleAvatarUpdate}
          />
        ) : (
          <>
            <div className="overview-header">
              <h1 className="overview-title">Settings</h1>
              <HeaderActions />
            </div>

            {/* Profile Row */}
            <div className="settings-profile-row">
              <div className="settings-user-wrapper">
                <div className="settings-avatar-wrapper">
                  {userInfo.avatar && userInfo.avatar !== '/profpic.svg' ? (
                    <img
                      src={userInfo.avatar}
                      alt="User Avatar"
                      className="settings-avatar-profile"
                      onError={e => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.querySelector('.settings-initial-avatar').style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback colored initial avatar, always rendered but hidden if image loads */}
                  <div
                    className="settings-initial-avatar"
                    style={{
                      display: (!userInfo.avatar || userInfo.avatar === '/profpic.svg') ? 'flex' : 'none',
                      backgroundColor: getAvatarColor(userInfo.name),
                      color: 'white',
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 28,
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  >
                    {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  {/* Profile icon overlapping - only this should trigger change avatar */}
                  <img
                    src="prof-icon.svg"
                    alt="Profile Icon"
                    className="profile-icon"
                    onClick={() => setShowChangeAvatar(true)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                <div className="settings-user-info">
                  <h3 className="settings-name">{userInfo.name}</h3>
                  <p className="settings-email">{userInfo.email}</p>
                  <p className="settings-hospital">{userInfo.hospital}</p>
                </div>
              </div>

              <button 
                className="update-password-btn"
                onClick={() => navigate('/change-password')}
              >
                <img
                  src="passw-icon.svg"
                  alt="Password Icon"
                  className="password-icon"
                />
                Update Password
              </button>
            </div>

            {/* Bio Data and Card Row */}
            <div className="settings-lower-row">
              {/* Bio Data Table */}
              <div className="bio-data-table">
                <h3>Bio Data</h3>
                <table>
                  <tbody>
                    <tr>
                      <td>Name</td>
                      <td>{userInfo.name}</td>
                    </tr>
                    <tr>
                      <td>Email</td>
                      <td>{userInfo.email}</td>
                    </tr>
                    <tr>
                      <td>Password</td>
                      <td>••••••••</td>
                    </tr>
                    <tr>
                      <td>Hospital</td>
                      <td>{userInfo.hospital}</td>
                    </tr>
                    <tr>
                      <td>Privilege</td>
                      <td>{userInfo.privilege}</td>
                    </tr>
                    <tr>
                      <td>Date Joined</td>
                      <td>{userInfo.dateJoined}</td>
                    </tr>
                    <tr>
                      <td>User ID</td>
                      <td>{userInfo.uid}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Course Card Style Container */}
              <div className="settings-card">
                <img src="login-img.png" alt="Card visual" className="card-image" />
                <p className="card-text">Stay updated with your profile activity and personalized settings.</p>
              </div>
            </div>

            {/* Dialog Box Section */}
            <div className="dialog-box settings-dialog-box">
              <h3 className="dialog-box-title">Important Documents</h3>
              <p className="dialog-box-text">
                Please review and download the documents related to your profile activity and settings.
              </p>

              <div className="dialog-buttons">
                <a
                  href="/Uboho_privacy_ethics_docs.pdf"
                  download
                  className="dialog-button purple"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  Get the Document
                </a>
                <a
                  href="/Uboho_privacy_ethics_docs.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dialog-button"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  Read Docs
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Make sure this export is on its own line with no whitespace issues
export default Settings;
