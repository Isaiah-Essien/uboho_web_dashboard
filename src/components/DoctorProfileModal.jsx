import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '../contexts/HospitalContext';
import './DoctorProfileModal.css';

const DoctorProfileModal = ({ 
  doctor, 
  isOpen, 
  onClose, 
  mode = 'view', // 'view' or 'edit'
  onModeChange,
  onDoctorUpdated,
  onDoctorDeleted 
}) => {
  const { updateDoctor, deleteDoctor } = useHospital();
  const navigate = useNavigate();
  const modalRef = useRef(null);
  
  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Initialize form data when doctor changes or modal opens
  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        email: doctor.email || '',
        specialization: doctor.specialization || ''
      });
    }
  }, [doctor]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateDoctor(doctor.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        specialization: formData.specialization.trim()
      });

      // Notify parent component that doctor was updated
      if (onDoctorUpdated) {
        onDoctorUpdated();
      }

      // Switch back to view mode
      onModeChange('view');
    } catch (error) {
      console.error('Error updating doctor:', error);
      setError('Failed to update doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async () => {
    setLoading(true);
    setError('');

    try {
      await deleteDoctor(doctor.id);
      
      // Notify parent component that doctor was deleted
      if (onDoctorDeleted) {
        onDoctorDeleted();
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setError('Failed to delete doctor. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleSendMessage = () => {
    if (doctor.authUid) {
      // Navigate to messages page with the doctor's auth UID
      navigate(`/messages/chat/${doctor.authId}`);
      onClose();
    } else {
      setError('Cannot send message to doctor without an account');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp.toDate) {
      // Firestore timestamp
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      // Timestamp object with seconds
      date = new Date(timestamp.seconds * 1000);
    } else {
      // Regular date string or timestamp
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen || !doctor) return null;

  return (
    <div className="modal-overlay">
      <div className="doctor-profile-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Doctor' : 'Doctor Profile'}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="doctor-info">
            <div className="doctor-avatar">
              {doctor.name ? doctor.name.charAt(0).toUpperCase() : 'D'}
            </div>

            {mode === 'view' ? (
              <div className="doctor-details">
                <div className="info-row">
                  <label>Name:</label>
                  <span>{doctor.name || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <label>Email:</label>
                  <span>{doctor.email || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <label>Specialization:</label>
                  <span>{doctor.specialization || 'General'}</span>
                </div>
                <div className="info-row">
                  <label>Status:</label>
                  <span className={`status-badge ${doctor.status || 'pending'}`}>
                    {(doctor.status || 'pending').charAt(0).toUpperCase() + (doctor.status || 'pending').slice(1)}
                  </span>
                </div>
                <div className="info-row">
                  <label>Date Joined:</label>
                  <span>{formatDate(doctor.createdAt)}</span>
                </div>
                <div className="info-row">
                  <label>Doctor ID:</label>
                  <span>{doctor.id}</span>
                </div>
                <div className="info-row">
                  <label>Account Status:</label>
                  <span>{doctor.authUid ? 'Has Account' : 'Pending Setup'}</span>
                </div>
              </div>
            ) : (
              <div className="doctor-edit-form">
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Doctor's full name"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="doctor@example.com"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Specialization:</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Medical specialization"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          {mode === 'view' ? (
            <>
              <button 
                className="btn btn-primary"
                onClick={handleSendMessage}
                disabled={!doctor.authUid}
                title={!doctor.authUid ? 'Doctor needs to set up account first' : 'Send a message'}
              >
                Send Message
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => onModeChange('edit')}
              >
                Edit
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-primary"
                onClick={handleSaveChanges}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  onModeChange('view');
                  setError('');
                  // Reset form data to original values
                  setFormData({
                    name: doctor.name || '',
                    email: doctor.email || '',
                    specialization: doctor.specialization || ''
                  });
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="confirmation-overlay">
            <div className="confirmation-modal">
              <div className="confirmation-header">
                <h3>Confirm Deletion</h3>
              </div>
              <div className="confirmation-content">
                <p>
                  Are you sure you want to delete <strong>{doctor.name}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="confirmation-actions">
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteDoctor}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfileModal;
