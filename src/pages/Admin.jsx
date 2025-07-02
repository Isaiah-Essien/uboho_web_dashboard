import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import UserCleanupTool from '../components/UserCleanupTool';
import DoctorProfileModal from '../components/DoctorProfileModal';
import { useHospital } from '../contexts/HospitalContext';
import '../overview.css';
import '../Patients.css';
import '../Admin.css';

const Admin = () => {
  const { getDoctors, currentHospital } = useHospital();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const dropdownRefs = useRef([]);
  const floatingMenuRef = useRef(null); // Added ref for the floating menu
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const navigate = useNavigate();
  
  // Modal state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
  
  // Column filter functionality
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    avatar: true,
    adminId: true, 
    name: true,
    email: true,
    hospital: true,
    dateJoined: true,
    actions: true
  });
  const filterMenuRef = useRef(null);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle column visibility
  const toggleColumn = (columnName) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const fetchedDoctors = await getDoctors();
        setDoctors(fetchedDoctors.map(doctor => ({
          ...doctor,
          hospital: currentHospital?.name || 'Unknown',
          dateJoined: doctor.createdAt ? new Date(doctor.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'
        })));
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [getDoctors, currentHospital]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuIndex !== null) {
        const triggerButtonRef = dropdownRefs.current[openMenuIndex];

        // If click is on the trigger button, let toggleMenu handle it
        if (triggerButtonRef && triggerButtonRef.contains(event.target)) {
          return;
        }

        // If click is inside the floating menu, do nothing
        if (floatingMenuRef.current && floatingMenuRef.current.contains(event.target)) {
          return;
        }
        
        // Otherwise, click is outside both, so close the menu
        // console.log('handleClickOutside: Closing menu. Click target:', event.target);
        setOpenMenuIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuIndex]);

  const toggleMenu = (index, e) => {
    e.stopPropagation();
    if (openMenuIndex === index) {
      setOpenMenuIndex(null);
      return;
    }
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const menuWidth = 140; // Approximate width of the menu
    let menuHeight = 120; // Default height, will adjust after render
    let leftPosition = rect.left + window.scrollX;
    let topPosition = rect.bottom + window.scrollY;

    // Adjust left if menu would overflow right edge
    if (leftPosition + menuWidth > window.innerWidth) {
      leftPosition = window.innerWidth - menuWidth - 10;
    }

    // Temporarily set menu position to calculate real height after render
    setMenuPosition({ top: topPosition, left: leftPosition });
    setOpenMenuIndex(index);

    // After menu is rendered, adjust if it overflows bottom
    setTimeout(() => {
      if (floatingMenuRef.current) {
        const menuRect = floatingMenuRef.current.getBoundingClientRect();
        menuHeight = menuRect.height;
        if (menuRect.bottom > window.innerHeight) {
          // Move menu above the button if it would overflow
          topPosition = rect.top + window.scrollY - menuHeight;
          setMenuPosition({ top: topPosition, left: leftPosition });
        }
      }
    }, 0);
  };

  const handleAction = (action, doctorId) => {
    console.log('handleAction called with:', action, doctorId);
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) {
        console.error('Doctor not found for ID:', doctorId);
        return;
    }

    setSelectedDoctor(doctor);
    setOpenMenuIndex(null);

    switch (action.toLowerCase()) {
        case 'view':
            setModalMode('view');
            setShowModal(true);
            break;
        case 'edit':
            setModalMode('edit');
            setShowModal(true);
            break;
        case 'delete':
            if (window.confirm(`Are you sure you want to delete Dr. ${doctor.name}?`)) {
                handleDoctorDeleted(doctorId);
            }
            break;
        default:
            console.warn('Unknown action:', action);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
    setModalMode('view');
  };

  const handleModeChange = (newMode) => {
    setModalMode(newMode);
  };

  const handleDoctorUpdated = async () => {
    // Refresh the doctors list
    try {
      const fetchedDoctors = await getDoctors();
      setDoctors(fetchedDoctors.map(doctor => ({
        ...doctor,
        hospital: currentHospital?.name || 'Unknown',
        dateJoined: doctor.createdAt ? new Date(doctor.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'
      })));
    } catch (err) {
      console.error('Error refreshing doctors:', err);
    }
  };

  const handleDoctorDeleted = async () => {
    // Refresh the doctors list after deletion
    await handleDoctorUpdated();
  };

  return (
    <div className="overview-container">
      <Sidebar />
      <div className="overview-content">
        <div className="overview-header">
          <h1 className="overview-title">Admin Panel</h1>
          <HeaderActions />
        </div>

        <div className="button-row">
          <button 
            className="add-patient-btn"
            onClick={() => navigate('/admin/create-doctor')}
          >
            <img src="/add-icon.svg" alt="Add Admin" />
            Add Admin
          </button>
          <div className="filter-container" ref={filterMenuRef}>
            <button 
              className="filter-columns-btn"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <img src="/filter-icon.svg" alt="Filter" className="filter-icon" />
              Filter Columns
            </button>
            
            {showFilterMenu && (
              <div className="filter-menu">
                <div className="filter-menu-options">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.avatar} 
                      onChange={() => toggleColumn('avatar')}
                    />
                    Avatar
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.adminId} 
                      onChange={() => toggleColumn('adminId')}
                    />
                    Admin ID
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.name} 
                      onChange={() => toggleColumn('name')}
                    />
                    Name
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.email} 
                      onChange={() => toggleColumn('email')}
                    />
                    Email
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.hospital} 
                      onChange={() => toggleColumn('hospital')}
                    />
                    Hospital
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.dateJoined} 
                      onChange={() => toggleColumn('dateJoined')}
                    />
                    Date Joined
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.actions} 
                      onChange={() => toggleColumn('actions')}
                    />
                    Actions
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="patients-table">
          {loading ? (
            <p>Loading doctors...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {columnVisibility.avatar && <th>Avatar</th>}
                  {columnVisibility.adminId && <th>Doctor ID</th>}
                  {columnVisibility.name && <th>Name</th>}
                  {columnVisibility.email && <th>Email</th>}
                  {columnVisibility.hospital && <th>Hospital</th>}
                  {columnVisibility.dateJoined && <th>Date Joined</th>}
                  {columnVisibility.actions && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor, index) => (
                  <tr key={doctor.id}>
                    {columnVisibility.avatar && (
                      <td>
                        {doctor.profileImageUrl ? (
                          <img 
                            src={doctor.profileImageUrl} 
                            alt={doctor.name}
                            className="patients-table patient-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="patient-avatar-placeholder"
                          style={{ display: doctor.profileImageUrl ? 'none' : 'flex' }}
                        >
                          {doctor.name ? doctor.name.charAt(0).toUpperCase() : 'D'}
                        </div>
                      </td>
                    )}
                    {columnVisibility.adminId && <td>{doctor.id}</td>}
                    {columnVisibility.name && <td>{doctor.name}</td>}
                    {columnVisibility.email && <td>{doctor.email}</td>}
                    {columnVisibility.hospital && <td>{doctor.hospital || 'N/A'}</td>}
                    {columnVisibility.dateJoined && <td>{doctor.dateJoined || 'Unknown'}</td>}
                    {columnVisibility.actions && (
                      <td className="actions-cell">
                        <div className="menu-wrapper" ref={(el) => (dropdownRefs.current[index] = el)}>
                          <button
                            className="menu-button"
                            onClick={(e) => toggleMenu(index, e)}
                          >
                            <img
                              src="/dots.svg"
                              alt="Actions"
                              className="menu-icon"
                            />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Floating Menu - Rendered outside the table to prevent layout issues */}
        {openMenuIndex !== null && (
          <div 
            ref={floatingMenuRef} // Added ref here
            className="floating-dropdown-menu"
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 9999
            }}
          >
            <div className="dropdown-menu-content">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('View button clicked for doctor:', doctors[openMenuIndex]?.id);
                  handleAction('View', doctors[openMenuIndex].id);
                }}
                className="dropdown-menu-item"
              >
                View
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Edit button clicked for doctor:', doctors[openMenuIndex]?.id);
                  handleAction('Edit', doctors[openMenuIndex].id);
                }}
                className="dropdown-menu-item"
              >
                Edit
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Delete button clicked for doctor:', doctors[openMenuIndex]?.id);
                  handleAction('Delete', doctors[openMenuIndex].id);
                }}
                className="dropdown-menu-item"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Doctor Profile Modal */}
        <DoctorProfileModal
          doctor={selectedDoctor}
          isOpen={showModal}
          onClose={handleCloseModal}
          mode={modalMode}
          onModeChange={handleModeChange}
          onDoctorUpdated={handleDoctorUpdated}
          onDoctorDeleted={handleDoctorDeleted}
        />
      </div>
    </div>
  );
};

export default Admin;
