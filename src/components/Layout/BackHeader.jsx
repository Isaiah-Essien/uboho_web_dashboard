import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackHeader = ({ title, destination = '/settings' }) => {
  const navigate = useNavigate();
  
  return (
    <div className="change-password-header">
      <button 
        className="change-password-back-button" 
        onClick={() => navigate(destination)}
      >
        <img src="/chevleft-icon.svg" alt="Back" />
      </button>
      {title && <h3 className="change-password-header-title">{title}</h3>}
    </div>
  );
};

export default BackHeader;
