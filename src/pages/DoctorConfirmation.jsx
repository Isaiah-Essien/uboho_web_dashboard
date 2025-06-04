import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomAuthImage from '../components/CustomAuthImageNew';
import BackHeader from '../components/BackHeaderNew';
import '../App.css';
import '../DoctorConfirmation.css';

const DoctorConfirmation = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get doctor data from navigation state
  const doctorData = location.state?.doctorData;
  const emailSent = location.state?.emailSent;
  const emailError = location.state?.emailError;

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
    <div className="fgp-page doctor-confirmation-page">
      <BackHeader title="" destination="/admin" />
      
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
            <h2 className="confirmation-title">Doctor Created Successfully</h2>
            <p className="confirmation-subtext">
              {doctorData ? (
                <>
                  Dr. {doctorData.name} has been successfully added to {doctorData.hospitalName}.
                  {doctorData.specialization && ` Specialization: ${doctorData.specialization}.`}
                </>
              ) : (
                'The new doctor has been created successfully.'
              )}
            </p>
            
            <button className="btn" onClick={() => navigate('/admin')}>
              Return to Admin Panel
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

export default DoctorConfirmation;
