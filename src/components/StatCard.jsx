// components/StatCard.jsx
import React from 'react';
import './styles/StatCard.css';

const StatCard = ({ title, percentage, icon, value }) => {
  return (
    <div className="stat-card">
      <div className="card-row">
        <div className="card-info">
          <div className="percentage">
            <div className="percentage-title">{title}</div>
            <div className="percentage-row">
              <img className="vector-icon" src="/Vector.svg" alt="Vector icon" />
              <span>{percentage}</span>
            </div>
          </div>
        </div>
        <div className="card-icon">
          <span className="icon-circle">
            <img src={icon} alt={`${title} icon`} className="card-icon-img" />
          </span>
        </div>
      </div>
      <div className="card-value">{value}</div>
    </div>
  );
};

export default StatCard;
