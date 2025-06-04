import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthImage from '../components/auth/AuthImage';
import '../App.css';

export default function Login() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/overview');
    }
  }, [currentUser, navigate]);

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(currentDateTime);

  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Africa/Maputo',
  }).format(currentDateTime);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/overview');
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
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      default:
        return 'An error occurred during login. Please try again.';
    }
  };

  return (
    <div className="login-page">
      {/* Left: Image */}
      <AuthImage imageUrl="/login-img.png" />

      {/* Right: Form */}
      <div className="form-panel">
        <div className="form-container">
          <p className="form-date">
            {formattedDate} · {formattedTime} CAT
          </p>

          <h2>Good morning, Doc!</h2>
          <p className="subheading">
            Let's get you back to monitoring safely and staying in control—your health journey continues here.
          </p>

          <form onSubmit={handleLogin}>
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

            <div className="input-group">
              <input
                type="password"
                className="email-input"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label className="floating-label">Password</label>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="forgotpass">
              <Link to="/forgotpass" className="forgotpasslink">
                Forgot Password ?
              </Link>
            </p>
          </form>

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
