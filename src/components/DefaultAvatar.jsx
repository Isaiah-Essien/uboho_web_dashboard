import React from 'react';
import './DefaultAvatar.css';

const DefaultAvatar = ({ name, size = 40 }) => {
  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return 'U'; // Default to 'U' for Unknown User
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to generate a consistent color based on the name
  const getAvatarColor = (name) => {
    if (!name) return '#6c757d'; // Default gray color
    
    // Array of nice colors for avatars
    const colors = [
      '#007bff', // Blue
      '#28a745', // Green
      '#dc3545', // Red
      '#ffc107', // Yellow
      '#6f42c1', // Purple
      '#fd7e14', // Orange
      '#20c997', // Teal
      '#e83e8c', // Pink
      '#17a2b8', // Cyan
      '#343a40', // Dark
    ];
    
    // Create a simple hash from the name to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div 
      className="default-avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: getAvatarColor(name),
        fontSize: size * 0.4,
        lineHeight: `${size}px`
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export default DefaultAvatar;
