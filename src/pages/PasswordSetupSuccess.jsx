import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomAuthImage from '../components/CustomAuthImageNew';
import '../App.css';
import '../FogP.css';
import '../PasswordConfirmation.css';

const PasswordSetupSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctorName, hospitalName } = location.state || {};

  return (
    <div className="fgp-page">
      <CustomAuthImage imageUrl="/styledimg.svg" />
      
      <div className="form-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
        <div className="form-container">
          <h2>Account Setup Complete!</h2>
          <p className="subheading">
            Welcome to {hospitalName || 'the hospital system'}, Dr. {doctorName}! 
            Your account has been successfully activated.
          </p>

          <div className="success-details" style={{ textAlign: 'left', margin: '20px auto', padding: '20px' }}>
            <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Account Setup Complete</p>
            <ul style={{ listStyleType: 'none', padding: 0, fontSize: '18px' }}>
              <li style={{ margin: '15px 0' }}>✔ Access the hospital dashboard</li>
              <li style={{ margin: '15px 0' }}>✔ Manage patient records</li>
              <li style={{ margin: '15px 0' }}>✔ Communicate with hospital staff</li>
              <li style={{ margin: '15px 0' }}>✔ View your schedule and assignments</li>
            </ul>
          </div>

          <button 
            className="btn"
            style={{ 
              marginTop: '50px', 
              padding: '10px 20px', 
              fontSize: '16px', 
              backgroundColor: '#4CAF50', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' 
            }}
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupSuccess;
