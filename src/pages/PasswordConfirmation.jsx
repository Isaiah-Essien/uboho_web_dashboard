import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAuthImage from '../components/CustomAuthImageNew';
import BackHeader from '../components/BackHeaderNew';
import '../App.css';
import '../PasswordConfirmation.css';

const PasswordConfirmation = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(currentDateTime);

  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Africa/Maputo'
  }).format(currentDateTime);

  return (
    <div className="fgp-page password-confirmation-page">
      <BackHeader title="" destination="/settings" />
      
      {/* Left: Image */}
      <CustomAuthImage imageUrl="/styledimg.svg" />

      {/* Right: Confirmation */}
      <div className="form-panel">
        <div className="form-container">
          {/* Date and Time */}
          <p className="form-date">
            {formattedDate} · {formattedTime} CAT
          </p>

          <div className="confirmation-content">
            <img src="/success.svg" alt="Success" className="confirmation-icon" />
            <h2 className="confirmation-title">Password Updated Successfully</h2>
            <p className="confirmation-subtext">
              Your password has been changed. You can now use your new password to access your account.
            </p>
            <button className="btn" onClick={() => navigate('/settings')}>
              Return to Settings
            </button>
          </div>

          {/* Carousel Dashes */}
          <div className="carousel-dashes">
            <span className="dash active"></span>
            <span className="dash"></span>
            <span className="dash"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordConfirmation;
