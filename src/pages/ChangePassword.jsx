import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAuthImage from '../components/CustomAuthImageNew';
import BackHeader from '../components/BackHeaderNew';
import '../App.css';
import '../FogP.css';
import '../ChangePassword.css';

const ChangePassword = () => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/password-confirmation');
  };

  return (
    <div className="fgp-page change-password-page">
      <BackHeader title="" />
      
      {/* Left: Image */}
      <CustomAuthImage imageUrl="/styledimg.svg" />

      {/* Right: Form */}
      <div className="form-panel">
        <div className="form-container">
          {/* Date and Time */}
          <p className="form-date">
            {formattedDate} · {formattedTime} CAT
          </p>

          <h2>Update password</h2>
          <p className="subheading">
            Enhance your account security by updating your password. Choose a strong combination for better protection.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Current Password Input */}
            <div className="input-group">
              <input
                type="password"
                className="email-input"
                placeholder=" "
                required
              />
              <label className="floating-label">Current Password</label>
            </div>

            {/* New Password Input */}
            <div className="input-group">
              <input
                type="password"
                className="email-input"
                placeholder=" "
                required
              />
              <label className="floating-label">New Password</label>
            </div>

            <button type="submit" className="btn">
              Update Password
            </button>
          </form>

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

export default ChangePassword;
