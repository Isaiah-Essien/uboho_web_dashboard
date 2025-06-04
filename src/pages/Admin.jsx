import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import UserCleanupTool from '../components/UserCleanupTool';
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const navigate = useNavigate();
  
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
        const currentRef = dropdownRefs.current[openMenuIndex];
        if (currentRef && !currentRef.contains(event.target)) {
          setOpenMenuIndex(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuIndex]);

  const toggleMenu = (index, e) => {
    e.stopPropagation();
    
    // If clicking on already open menu, close it
    if (openMenuIndex === index) {
      setOpenMenuIndex(null);
      return;
    }
    
    // Calculate position for the dropdown
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const menuWidth = 140; // Approximate width of the menu
    
    // Calculate the best left position to ensure the menu is fully visible
    // If the menu would go off-screen to the right, shift it to the left
    let leftPosition = rect.left + window.scrollX;
    const rightEdgePosition = leftPosition + menuWidth;
    
    // If the menu would go beyond the right edge of the screen, adjust leftPosition
    if (rightEdgePosition > window.innerWidth) {
      leftPosition = leftPosition - (rightEdgePosition - window.innerWidth) - 20; // Add extra 20px margin
    }
    
    // Ensure menu doesn't go off-screen to the left
    leftPosition = Math.max(10, leftPosition);
    
    // Set position based on button's position in viewport
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: leftPosition
    });
    
    // Open the menu
    setOpenMenuIndex(index);
  };

  const handleAction = (action, adminId) => {
    console.log(`${action} clicked for ${adminId}`);
    setOpenMenuIndex(null);
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
                        <div className="patient-avatar-placeholder">
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
            className="floating-dropdown-menu"
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 9999
            }}
          >
            <div className="dropdown-menu-content">
              <button onClick={() => handleAction('Edit', doctors[openMenuIndex].id)}>
                Edit
              </button>
              <button onClick={() => handleAction('Delete', doctors[openMenuIndex].id)}>
                Delete
              </button>
              <button onClick={() => handleAction('View', doctors[openMenuIndex].id)}>
                View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
