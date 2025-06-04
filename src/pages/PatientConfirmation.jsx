import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../PatientConfirmation.css';

const PatientConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="confirmation-container">
      <img src="/success.svg" alt="Success" className="confirmation-icon" />
      <h2 className="confirmation-title">You have successfully added a patient</h2>
      <p className="confirmation-subtext">
        The patient's details have been saved and added to your records.
      </p>
      <button className="go-back-button" onClick={() => navigate('/patients')}>
        Go back to patient page
      </button>
    </div>
  );
};

export default PatientConfirmation;
