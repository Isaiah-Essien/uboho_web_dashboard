import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthImage from '../components/auth/AuthImage';
import '../App.css';
import '../FogP.css';

export default function OtpPage() {
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
    // Add verification logic here
    console.log('OTP submitted');
  };

  return (
    <div className="fgp-page">
      {/* Left: Image */}
      <AuthImage imageUrl="/forgotp-img.png" />

      {/* Right: Form */}
      <div className="form-panel">
        <div className="form-container">
          {/* Date and Time */}
          <p className="form-date">
            {formattedDate} · {formattedTime} CAT
          </p>

          <h2>Enter OTP</h2>
          <p className="subheading">
            Please enter the verification code sent to your email to continue.
          </p>

          <form onSubmit={handleSubmit}>
            {/* OTP input */}
            <div className="input-group">
              <input
                type="text"
                className="email-input"
                placeholder=" "
                required
              />
              <label className="floating-label">OTP Code</label>
            </div>

            <button type="submit" className="btn">
              Verify
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
}
