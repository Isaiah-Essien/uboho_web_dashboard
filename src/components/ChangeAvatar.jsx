import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { storage, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import HeaderActions from './HeaderActions';
import '../components/styles/ChangeAvatar.css';

const ChangeAvatar = ({ onClose, currentAvatar, onAvatarUpdate }) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentHospital } = useHospital();

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
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB.');
      return;
    }

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
    setIsUploading(false);
  };

  // Handle image movement
  const handleMouseDown = (e) => {
    if (!previewUrl || isUploading) return;
    
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

  // Update user avatar in Firestore based on their role
  const updateUserAvatar = async (downloadURL) => {
    try {
      if (!currentHospital) {
        console.log('No hospital context, skipping Firestore update');
        return;
      }

      // Check if user is admin
      if (currentHospital.adminId === currentUser.uid) {
        // Update admin document in users collection
        const adminDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(adminDocRef, {
          avatar: downloadURL,
          photoURL: downloadURL
        });
        console.log('Admin avatar updated in users collection');
      } else {
        // Check if user is doctor or patient and update accordingly
        try {
          // Try to find and update doctor document
          const doctorsQuery = query(
            collection(db, 'hospitals', currentHospital.id, 'doctors'),
            where('authUid', '==', currentUser.uid)
          );
          const doctorsSnapshot = await getDocs(doctorsQuery);
          
          if (!doctorsSnapshot.empty) {
            const doctorDoc = doctorsSnapshot.docs[0];
            await updateDoc(doctorDoc.ref, {
              avatar: downloadURL,
              photoURL: downloadURL
            });
            console.log('Doctor avatar updated');
            return;
          }

          // Try to find and update patient document
          const patientsQuery = query(
            collection(db, 'hospitals', currentHospital.id, 'patients'),
            where('authUid', '==', currentUser.uid)
          );
          const patientsSnapshot = await getDocs(patientsQuery);
          
          if (!patientsSnapshot.empty) {
            const patientDoc = patientsSnapshot.docs[0];
            await updateDoc(patientDoc.ref, {
              avatar: downloadURL,
              photoURL: downloadURL
            });
            console.log('Patient avatar updated');
            return;
          }

          console.log('User not found in doctors or patients collections');
        } catch (error) {
          console.error('Error updating user avatar in Firestore:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateUserAvatar:', error);
    }
  };

  // Handle form submission - upload to Firebase Storage and update profile
  const handleSubmit = async () => {
    if (!image || !currentUser) {
      alert('Please select an image and ensure you are logged in.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create a unique filename that matches the Firebase Storage security rule
      const fileName = `profile_images/${currentUser.uid}`;
      
      console.log('Starting upload:', fileName);
      
      // Create storage reference
      const storageRef = ref(storage, fileName);
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, image);
      
      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress);
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          let errorMessage = 'Error uploading image. ';
          
          if (error.code === 'storage/unauthorized') {
            errorMessage += 'You do not have permission to upload files. Please contact your administrator.';
          } else if (error.code === 'storage/canceled') {
            errorMessage += 'Upload was canceled.';
          } else if (error.code === 'storage/unknown') {
            errorMessage += 'An unknown error occurred. Please check your internet connection and try again.';
          } else {
            errorMessage += 'Please try again later.';
          }
          
          alert(errorMessage);
          setIsUploading(false);
        },
        async () => {
          try {
            console.log('Upload completed, getting download URL...');
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL:', downloadURL);
            
            // Update Firebase Auth profile
            await updateProfile(currentUser, {
              photoURL: downloadURL
            });
            console.log('Firebase Auth profile updated');

            // Update user document based on their role
            await updateUserAvatar(downloadURL);
            console.log('Firestore document updated');
            
            // Call the callback to update parent component
            if (onAvatarUpdate) {
              onAvatarUpdate(downloadURL);
            }
            
            alert('Profile picture updated successfully!');
            onClose();
          } catch (error) {
            console.error('Error updating profile:', error);
            alert('Upload completed but there was an error updating your profile. Please refresh the page.');
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error starting upload:', error);
      alert('Error starting upload. Please check your internet connection and try again.');
      setIsUploading(false);
    }
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
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
                disabled={isUploading}
              />
              <div className="drop-icon">
                <img src="/add-icon.svg" alt="Upload" />
              </div>
              <p>{isUploading ? 'Uploading...' : 'Drag & Drop your image here or click to browse'}</p>
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
                    {!isUploading && uploadProgress < 100 && (
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
                    src={currentAvatar || "/default-avatar.png"}
                    alt="Current Avatar"
                    className="current-avatar-preview"
                  />
                )}
              </div>
            </div>
            
            {previewUrl && !isUploading && (
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
          disabled={!previewUrl || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Update Profile Picture'}
        </button>
      </div>
    </div>
  );
};

export default ChangeAvatar;
