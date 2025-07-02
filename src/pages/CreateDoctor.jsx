import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '../contexts/HospitalContext';
import { useAuth } from '../contexts/AuthContext';
import { sendDoctorInvitationEmail, generateSetupToken } from '../utils/emailService';
import CustomAuthImage from '../components/CustomAuthImageNew';
import BackHeader from '../components/BackHeaderNew';
import '../App.css';
import '../FogP.css';
import '../CreateDoctor.css';

const CreateDoctor = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { currentHospital, addDoctor } = useHospital();
  const { currentUser } = useAuth();

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
    
    if (!currentHospital) {
      setError('No hospital associated with your account. Please contact support.');
      return;
    }

    if (!formData.name || !formData.email) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate setup token for password creation
      const setupToken = generateSetupToken();
      
      // Create doctor in database first
      const doctorId = await addDoctor(formData, setupToken);
      
      let emailSent = false;
      
      // Try to send invitation email, but don't fail if it doesn't work
      try {
        await sendDoctorInvitationEmail({
          ...formData,
          hospitalName: currentHospital.name
        }, setupToken);
        emailSent = true;
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Email failed but doctor was created successfully
        emailSent = false;
      }
      
      // Navigate to confirmation page with success data
      navigate('/doctor-confirmation', {
        state: {
          success: true,
          doctorData: {
            ...formData,
            id: doctorId,
            hospitalName: currentHospital.name
          },
          emailSent: emailSent,
          emailError: !emailSent
        }
      });
    } catch (error) {
      console.error('Error creating doctor:', error);
      
      // Safe error message handling - check if error exists and has properties
      let errorMessage = 'Unknown error';
      
      try {
        if (error && typeof error === 'object') {
          errorMessage = error.message || error.text || error.toString();
        } else if (error && typeof error === 'string') {
          errorMessage = error;
        } else if (error) {
          errorMessage = String(error);
        }
      } catch (e) {
        console.error('Error processing error message:', e);
        errorMessage = 'Error processing failed';
      }
      
      // Check error type and provide appropriate message
      if (errorMessage.includes('email address already exists')) {
        setError('A doctor with this email address already exists in your hospital. Please use a different email address.');
      } else if (errorMessage.toLowerCase().includes('email') || 
          errorMessage.includes('EmailJSResponseStatus') ||
          (error && error.name && error.name.includes('EmailJS'))) {
        setError('Doctor created but failed to send invitation email. Please contact the doctor manually with setup instructions.');
      } else if (errorMessage.toLowerCase().includes('network') || 
                 errorMessage.toLowerCase().includes('connection')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMessage.toLowerCase().includes('permission') || 
                 errorMessage.toLowerCase().includes('unauthorized')) {
        setError('Permission denied. Please check your account permissions.');
      } else {
        setError(`Failed to create doctor: ${errorMessage}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fgp-page create-doctor-page">
      <BackHeader title="" destination="/admin" />
      
      {/* Left: Image */}
      <CustomAuthImage imageUrl="/styledimg.svg" />

      {/* Right: Form */}
      <div className="form-panel">
        <div className="form-container">
          {/* Date and Time */}
          <p className="form-date">
            {formattedDate} · {formattedTime} CAT
          </p>

          <h2>Add New Doctor</h2>
          <p className="subheading">
            Add a new doctor to {currentHospital?.name || 'your hospital'}. Fill in the doctor's information below.
          </p>

          {error && (
            <div className="error-message" style={{
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name Input */}
            <div className="input-group">
              <input
                type="text"
                name="name"
                className="email-input"
                placeholder=" "
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <label className="floating-label">Full Name</label>
            </div>

            {/* Email Input */}
            <div className="input-group">
              <input
                type="email"
                name="email"
                className="email-input"
                placeholder=" "
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <label className="floating-label">Email Address</label>
            </div>

            {/* Specialization Input */}
            <div className="input-group">
              <input
                type="text"
                name="specialization"
                className="email-input"
                placeholder=" "
                value={formData.specialization}
                onChange={handleInputChange}
              />
              <label className="floating-label">Specialization (Optional)</label>
            </div>

            {/* Hospital Display (Read-only) */}
            {currentHospital && (
              <div className="input-group">
                <input
                  type="text"
                  className="email-input"
                  value={currentHospital.name}
                  disabled
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'not-allowed'
                  }}
                />
                <label className="floating-label">Hospital</label>
              </div>
            )}

            <button 
              type="submit" 
              className="btn"
              disabled={loading}
              style={{
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Doctor...' : 'Create Doctor'}
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

export default CreateDoctor;
