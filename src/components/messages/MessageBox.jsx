import React from 'react';
import './styles/MessageBox.css';

const MessageBox = ({ title, text }) => {
  return (
    <div className="message-box">
      <h3 className="message-title">{title}</h3>
      <p className="message-text">{text}</p>
    </div>
  );
};

export default MessageBox;
