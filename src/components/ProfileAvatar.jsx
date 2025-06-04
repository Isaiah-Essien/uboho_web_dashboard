import React from 'react';
import './styles/ProfileAvatar.css';

const ProfileAvatar = ({ 
  name, 
  avatar, 
  size = 40, 
  className = '', 
  onClick,
  style = {} 
}) => {
  const getInitial = (name) => {
    if (!name) return 'U'; // Default to 'U' for Unknown User
    return name.charAt(0).toUpperCase();
  };

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.4}px`, // Scale font size based on avatar size
    ...style
  };

  // If avatar exists and is not the default, show the image
  if (avatar && avatar !== 'default-avatar.png') {
    // Check if it's a full URL (Firebase Storage) or relative path
    const avatarSrc = avatar.startsWith('http') ? avatar : `/${avatar}`;
    
    return (
      <div className={`profile-avatar-wrapper ${className}`} onClick={onClick}>
        <img
          src={avatarSrc}
          alt={name || 'User Avatar'}
          className="profile-avatar-image"
          style={avatarStyle}
          onError={(e) => {
            // If image fails to load, replace with letter circle
            const placeholder = document.createElement('div');
            placeholder.className = 'profile-avatar-placeholder';
            placeholder.textContent = getInitial(name);
            placeholder.style.width = avatarStyle.width;
            placeholder.style.height = avatarStyle.height;
            placeholder.style.fontSize = avatarStyle.fontSize;
            
            e.target.parentNode.replaceChild(placeholder, e.target);
          }}
        />
      </div>
    );
  }

  // Fallback to letter circle
  return (
    <div 
      className={`profile-avatar-placeholder ${className}`} 
      style={avatarStyle}
      onClick={onClick}
    >
      {getInitial(name)}
    </div>
  );
};

export default ProfileAvatar;
