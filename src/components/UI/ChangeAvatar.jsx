import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderActions from './HeaderActions';
import '../components/styles/ChangeAvatar.css';

const ChangeAvatar = ({ onClose, currentAvatar }) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const navigate = useNavigate();

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle drag over event
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave event
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Handle file selection (common for drop and input change)
  const handleFile = (file) => {
    setImage(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadstart = () => {
      setUploadProgress(0);
    };
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      setUploadProgress(100);
      
      // Reset position and scale when a new image is loaded
      setImagePosition({ x: 0, y: 0 });
      setScale(1);
    };
    
    reader.readAsDataURL(file);
  };

  // Cancel upload
  const handleCancelUpload = () => {
    setImage(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  // Handle image movement
  const handleMouseDown = (e) => {
    if (!previewUrl) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosition = { ...imagePosition };
    
    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setImagePosition({
        x: startPosition.x + dx,
        y: startPosition.y + dy
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle scale change
  const handleScaleChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Here you would typically send the image to your server
    // along with the positioning data to crop/position it correctly
    
    // For demonstration purposes, we'll just simulate success
    alert('Profile picture updated successfully!');
    onClose();
  };

  return (
    <div className="avatar-change-container">
      <div className="avatar-change-header">
        <div className="back-and-title">
          <button onClick={onClose} className="back-button">
            <img src="/chevleft-icon.svg" alt="Back" />
          </button>
          <h1 className="avatar-title">Avatar</h1>
        </div>
        <HeaderActions />
      </div>

      <div className="avatar-change-content">
        <h2 className="section-title">Profile Picture</h2>
        <p className="section-description">
          Upload a new profile picture by dragging and dropping an image or selecting a file.
        </p>

        <div className="avatar-change-columns">
          <div className="upload-column">
            <div 
              className={`drop-area ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div className="drop-icon">
                <img src="/add-icon.svg" alt="Upload" />
              </div>
              <p>Drag & Drop your image here or click to browse</p>
            </div>

            {uploadProgress > 0 && (
              <div className="progress-container">
                <div className="file-upload-status">
                  <div className="file-icon">
                    <img src="/add-icon.svg" alt="File" />
                  </div>
                  <div className="file-info">
                    <div className="file-name">{image ? image.name : 'Uploading image...'}</div>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="progress-details">
                    <span className="progress-text">{uploadProgress}%</span>
                    {uploadProgress < 100 && (
                      <button className="cancel-upload" onClick={handleCancelUpload}>
                        <span>×</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="preview-column">
            <div className="preview-container" onMouseDown={handleMouseDown}>
              <div className="avatar-circle">
                {previewUrl ? (
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${scale})`,
                    }}
                  />
                ) : (
                  <img
                    src={currentAvatar || "/login-img.png"}
                    alt="Current Avatar"
                    className="current-avatar-preview"
                  />
                )}
              </div>
            </div>
            
            {previewUrl && (
              <div className="scale-controls">
                <span>Zoom:</span>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={scale}
                  onChange={handleScaleChange}
                />
              </div>
            )}
          </div>
        </div>

        <button 
          className="update-avatar-btn" 
          onClick={handleSubmit}
          disabled={!previewUrl}
        >
          Update Profile Picture
        </button>
      </div>
    </div>
  );
};

export default ChangeAvatar;
