import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '../contexts/HospitalContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import HeaderActions from '../components/HeaderActions';
import '../overview.css';
import '../Patients.css';

const Patients = () => {
  const navigate = useNavigate();
  const { currentHospital, subscribeToPatients, getAllPatientsSeizureEvents } = useHospital();
  const [patients, setPatients] = useState([]);
  const [patientsWithLocations, setPatientsWithLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    avatar: true,
    patientId: true, 
    name: true,
    email: true,
    status: true,
    location: true
  });
  const filterMenuRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 5;

  // Set up real-time subscription to patients data
  useEffect(() => {
    if (!currentHospital) {
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('Setting up real-time patients subscription');

    const unsubscribe = subscribeToPatients((patientsData) => {
      console.log('Patients data updated in real-time:', patientsData.length, 'patients');
      // Debug: Log patient data structure to see available fields
      if (patientsData.length > 0) {
        console.log('Sample patient data:', patientsData[0]);
        console.log('Patient fields:', Object.keys(patientsData[0]));
      }
      setPatients(patientsData);
      setError('');
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up patients subscription');
      unsubscribe();
    };
  }, [currentHospital, subscribeToPatients]);

  // Fetch seizure events and merge with patient location data
  useEffect(() => {
    const fetchPatientsWithLocationData = async () => {
      if (!currentHospital || patients.length === 0) {
        setPatientsWithLocations(patients);
        return;
      }

      try {
        // Get patients with seizure events (same as map)
        const patientsWithEvents = await getAllPatientsSeizureEvents();
        console.log('Patients with seizure events for table:', patientsWithEvents);
        
        // Create a map of seizure events for quick lookup
        const seizureEventsMap = new Map();
        patientsWithEvents.forEach(patient => {
          if (patient.lastSeizureEvent) {
            seizureEventsMap.set(patient.id, patient.lastSeizureEvent);
          }
        });
        
        // Merge location data with patients
        const patientsWithLocationData = patients.map(patient => {
          const seizureEvent = seizureEventsMap.get(patient.id);
          return {
            ...patient,
            locationData: seizureEvent?.location || null,
            seizureStatus: seizureEvent?.status || 'normal'
          };
        });
        
        setPatientsWithLocations(patientsWithLocationData);
      } catch (error) {
        console.error('Error fetching seizure events for patients table:', error);
        setPatientsWithLocations(patients);
      }
    };

    fetchPatientsWithLocationData();
  }, [patients, currentHospital, getAllPatientsSeizureEvents]);

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

  // Calculate patient statistics
  const getPatientStats = () => {
    const totalPatients = patients.length;
    const activePatients = patients.filter(p => p.status === 'active').length;
    const inactivePatients = patients.filter(p => p.status === 'inactive').length;
    const newPatients = patients.filter(p => {
      if (!p.createdAt) return false;
      const createdDate = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length;

    return {
      total: totalPatients,
      active: activePatients,
      inactive: inactivePatients,
      new: newPatients
    };
  };

  const stats = getPatientStats();

  // Pagination calculations
  const totalPages = Math.ceil(patientsWithLocations.length / patientsPerPage);
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = patientsWithLocations.slice(indexOfFirstPatient, indexOfLastPatient);

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  const statData = [
    {
      title: 'All Patients',
      value: stats.total,
      percentage: stats.new > 0 ? `+${stats.new} new` : '0 new',
      icon: 'card1-img.svg',
    },
    {
      title: 'Active Patients',
      value: stats.active,
      percentage: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : '0%',
      icon: 'card2-img.svg',
    },
    {
      title: 'Inactive Patients',
      value: stats.inactive,
      percentage: stats.total > 0 ? `${Math.round((stats.inactive / stats.total) * 100)}%` : '0%',
      icon: 'card3-img.svg',
    },
    {
      title: 'New This Month',
      value: stats.new,
      percentage: '+30 days',
      icon: 'card5-img.svg',
    },
  ];

  // Display loading or error states
  if (loading) {
    return (
      <div className="overview-container">
        <Sidebar />
        <div className="overview-content">
          <div className="overview-header">
            <h1 className="overview-title">Patients</h1>
            <HeaderActions />
          </div>
          <div className="loading-message">Loading patients...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-container">
        <Sidebar />
        <div className="overview-content">
          <div className="overview-header">
            <h1 className="overview-title">Patients</h1>
            <HeaderActions />
          </div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-container">
      <Sidebar />
      <div className="overview-content">
        <div className="overview-header">
          <h1 className="overview-title">Patients</h1>
          <HeaderActions />
        </div>

        <div className="card-grid">
          {statData.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={card.value}
              percentage={card.percentage}
              icon={card.icon}
            />
          ))}
        </div>

        <div className="button-row">
          <button
            className="add-patient-btn"
            onClick={() => navigate('/patients/add')}
          >
            <img src="add-icon.svg" alt="Add Patient Icon" />
            Add Patient
          </button>
          <div className="filter-container" ref={filterMenuRef}>
            <button 
              className="filter-columns-btn"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <img src="filter-icon.svg" alt="Filter Icon" className="filter-icon" />
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
                      checked={columnVisibility.patientId} 
                      onChange={() => toggleColumn('patientId')}
                    />
                    Patient ID
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
                      checked={columnVisibility.status} 
                      onChange={() => toggleColumn('status')}
                    />
                    Status
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={columnVisibility.location} 
                      onChange={() => toggleColumn('location')}
                    />
                    Location
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="patients-table">
          {patientsWithLocations.length === 0 ? (
            <div className="empty-state">
              <p>No patients found. Add your first patient to get started.</p>
              <button
                className="add-patient-btn"
                onClick={() => navigate('/patients/add')}
              >
                <img src="add-icon.svg" alt="Add Patient Icon" />
                Add First Patient
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  {columnVisibility.avatar && <th>Avatar</th>}
                  {columnVisibility.patientId && <th>Patient ID</th>}
                  {columnVisibility.name && <th>Name</th>}
                  {columnVisibility.email && <th>Email</th>}
                  {columnVisibility.status && <th>Status</th>}
                  {columnVisibility.location && <th>Location</th>}
                </tr>
              </thead>
              <tbody>
                {currentPatients.map((patient, index) => (
                  <tr
                    key={patient.id || index}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {columnVisibility.avatar && (
                      <td>
                        {patient.profileImageUrl ? (
                          <img 
                            src={patient.profileImageUrl} 
                            alt={patient.name}
                            className="patients-table patient-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="patient-avatar-placeholder"
                          style={{ display: patient.profileImageUrl ? 'none' : 'flex' }}
                        >
                          {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                      </td>
                    )}
                    {columnVisibility.patientId && <td>{patient.id}</td>}
                    {columnVisibility.name && <td>{patient.name || 'N/A'}</td>}
                    {columnVisibility.email && <td>{patient.email || 'N/A'}</td>}
                    {columnVisibility.status && (
                      <td>
                        <span className={`status-badge ${patient.seizureStatus === 'seizure' || patient.seizureStatus === 'active_seizure' ? 'seizure' : 'no-seizure'}`}>
                          {patient.seizureStatus === 'seizure' || patient.seizureStatus === 'active_seizure' ? 'seizure' : 'no-seizure'}
                        </span>
                      </td>
                    )}
                    {columnVisibility.location && (
                      <td>
                        {patient.locationData && 
                         (patient.locationData.lat || patient.locationData.latitude) && 
                         (patient.locationData.long || patient.locationData.longitude)
                          ? `${(patient.locationData.lat || patient.locationData.latitude).toFixed(6)}, ${(patient.locationData.long || patient.locationData.longitude).toFixed(6)}`
                          : 'No GPS Data'
                        }
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {patientsWithLocations.length > 0 && (
          <div className="pagination-bar">
            <button 
              className="pagination-btn chevron"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <img src="chevleft-icon.svg" alt="Previous Page" />
            </button>
            <div className="pagination-pages">
              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`pagination-page ${pageNumber === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button 
              className="pagination-btn chevron"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <img src="chevright-icon.svg" alt="Next Page" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
