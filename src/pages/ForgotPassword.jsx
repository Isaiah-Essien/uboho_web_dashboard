import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthImage from '../components/auth/AuthImage';
import '../App.css';
import '../FogP.css';

export default function ForgotPass() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your email for password reset instructions.');
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
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

          <h2>Verify account</h2>
          <p className="subheading">
            Let's get you back to monitoring safely and staying in control—your health journey continues here.
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" style={{ 
                color: '#ff4444', 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#ffe6e6', 
                border: '1px solid #ffcccc', 
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}
            
            {message && (
              <div className="success-message" style={{ 
                color: '#22c55e', 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #22c55e', 
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}>
                {message}
              </div>
            )}

            {/* Email input */}
            <div className="input-group">
              <input
                type="email"
                className="email-input"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label className="floating-label">Email</label>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Sending...' : 'Get code'}
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
