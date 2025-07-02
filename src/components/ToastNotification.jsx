import React, { useState, useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className={`toast-notification ${isVisible ? 'show' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">
          💬
        </div>
        <div className="toast-text">
          <div className="toast-title">{notification.title}</div>
          <div className="toast-message">{notification.message}</div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
