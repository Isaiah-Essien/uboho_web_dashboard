import React, { useState, useRef } from 'react';
import { uploadAndUpdateProfileImage } from '../services/profileImageService';
import './ProfileImageUpload.css';

const ProfileImageUpload = ({ 
  userId, 
  userType, 
  hospitalId, 
  currentImageUrl, 
  onImageUpdate,
  size = 100 
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);

      // Upload image
      const imageUrl = await uploadAndUpdateProfileImage(file, userId, userType, hospitalId);
      
      // Update parent component
      if (onImageUpdate) {
        onImageUpdate(imageUrl);
      }
      
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setPreviewUrl(currentImageUrl); // Reset preview on error
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="profile-image-upload">
      <div 
        className="profile-image-container"
        style={{ width: size, height: size }}
        onClick={handleClick}
      >
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Profile" 
            className="profile-image"
            style={{ width: size, height: size }}
          />
        ) : (
          <div 
            className="profile-image-placeholder"
            style={{ 
              width: size, 
              height: size, 
              fontSize: size * 0.4,
              lineHeight: `${size}px`
            }}
          >
            {getInitials(userId)}
          </div>
        )}
        
        <div className="profile-image-overlay">
          {uploading ? (
            <div className="upload-spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="upload-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16Z" fill="white"/>
                <path d="M5 20V18H19V20H5Z" fill="white"/>
              </svg>
            </div>
          )}
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />
    </div>
  );
};

export default ProfileImageUpload;
