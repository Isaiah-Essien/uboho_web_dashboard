import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';

const UserCleanupTool = () => {
  const [orphanedUsers, setOrphanedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { currentUser } = useAuth();
  const { currentHospital } = useHospital();

  // Function to find users that exist in Firestore but might have Auth conflicts
  const findPotentialConflicts = async () => {
    if (!currentHospital) return;
    
    setLoading(true);
    setMessage('Checking for potential email conflicts...');
    
    try {
      const conflicts = [];
      
      // Check doctors collection
      const doctorsSnapshot = await getDocs(
        collection(db, 'hospitals', currentHospital.id, 'doctors')
      );
      
      doctorsSnapshot.forEach((doc) => {
        const doctorData = doc.data();
        if (!doctorData.authUid && doctorData.email) {
          conflicts.push({
            id: doc.id,
            name: doctorData.name,
            email: doctorData.email,
            role: 'doctor',
            type: 'no_auth_uid'
          });
        }
      });
      
      // Check patients collection
      const patientsSnapshot = await getDocs(
        collection(db, 'hospitals', currentHospital.id, 'patients')
      );
      
      patientsSnapshot.forEach((doc) => {
        const patientData = doc.data();
        if (!patientData.authUid && patientData.email) {
          conflicts.push({
            id: doc.id,
            name: patientData.name,
            email: patientData.email,
            role: 'patient',
            type: 'no_auth_uid'
          });
        }
      });
      
      setOrphanedUsers(conflicts);
      setMessage(`Found ${conflicts.length} users without auth accounts that might have email conflicts.`);
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to test if an email can be used for creating a new account
  const testEmailAvailability = async (email) => {
    try {
      // Try to create a user with this email (we'll delete it immediately)
      const tempPassword = 'TempPassword123!';
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      
      // If successful, delete the user immediately
      await deleteUser(userCredential.user);
      
      return { available: true, message: 'Email is available' };
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        return { available: false, message: 'Email is already in use in Firebase Auth' };
      } else {
        return { available: false, message: `Error: ${error.message}` };
      }
    }
  };

  // Test all potential conflict emails
  const testAllEmails = async () => {
    setLoading(true);
    setMessage('Testing email availability...');
    
    const updatedUsers = [];
    
    for (const user of orphanedUsers) {
      const result = await testEmailAvailability(user.email);
      updatedUsers.push({
        ...user,
        emailStatus: result
      });
    }
    
    setOrphanedUsers(updatedUsers);
    setMessage('Email availability check completed.');
    setLoading(false);
  };

  if (!currentUser || !currentHospital) {
    return (
      <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px' }}>
        <p>Please log in and ensure you have a hospital associated with your account.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px' }}>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>🔧 User Cleanup Tool</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>
          This tool helps identify users that might have Firebase Auth conflicts.
        </p>
        <button
          onClick={findPotentialConflicts}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Checking...' : 'Find Potential Conflicts'}
        </button>
        
        {orphanedUsers.length > 0 && (
          <button
            onClick={testAllEmails}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Testing...' : 'Test Email Availability'}
          </button>
        )}
      </div>

      {message && (
        <div style={{ 
          padding: '10px', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#856404'
        }}>
          {message}
        </div>
      )}

      {orphanedUsers.length > 0 && (
        <div>
          <h4 style={{ color: '#333', marginBottom: '15px' }}>Users without Auth UIDs:</h4>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {orphanedUsers.map((user, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '15px', 
                  background: 'white', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{user.name}</strong> ({user.role})
                    <br />
                    <span style={{ color: '#666' }}>{user.email}</span>
                    <br />
                    <small style={{ color: '#999' }}>ID: {user.id}</small>
                  </div>
                  {user.emailStatus && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: user.emailStatus.available ? '#d4edda' : '#f8d7da',
                        color: user.emailStatus.available ? '#155724' : '#721c24'
                      }}>
                        {user.emailStatus.available ? '✓ Available' : '✗ Conflict'}
                      </span>
                      <br />
                      <small style={{ color: '#666' }}>{user.emailStatus.message}</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            padding: '15px', 
            background: '#e7f3ff', 
            border: '1px solid #b8daff',
            borderRadius: '4px',
            marginTop: '20px'
          }}>
            <h5 style={{ color: '#0c5460', margin: '0 0 10px 0' }}>💡 How to resolve conflicts:</h5>
            <ol style={{ color: '#0c5460', margin: 0, paddingLeft: '20px' }}>
              <li>For users marked as "Conflict": The email exists in Firebase Auth but the user was deleted from Firestore</li>
              <li>You need to either:
                <ul>
                  <li>Use Firebase Console to delete the user from Authentication</li>
                  <li>Or use a different email address for the new user</li>
                  <li>Or restore the user in Firestore with the existing Auth UID</li>
                </ul>
              </li>
              <li>For users marked as "Available": You can proceed with creating accounts for these users</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCleanupTool;
