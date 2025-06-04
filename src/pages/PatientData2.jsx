import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import PatientDataTable from '../components/PatientDataTableNew';
import '../PatientData2.css';

const PatientData2 = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  // Pagination settings
  const recordsPerPage = 6;
  
  // Sample data for the first table
  const patientInfoData = [
    { label: "Patient ID", value: patientId || "P12345" },
    { label: "Blood Type", value: "O+" },
    { label: "Height", value: "175 cm" },
    { label: "Weight", value: "70 kg" },
    { label: "Date of Birth", value: "15-05-1985" },
    { label: "Phone", value: "+1 (555) 123-4567" }
  ];
  
  // Sample data for the second table
  const medicalHistoryData = [
    { label: "Past Seizures", value: "12" },
    { label: "Last Seizure", value: "10-03-2023" },
    { label: "Medications", value: "Keppra, Lamictal" },
    { label: "Allergies", value: "Penicillin" },
    { label: "Emergency Contact", value: "+1 (555) 987-6543" },
    { label: "Primary Doctor", value: "Dr. Smith" }
  ];

  // Sample seizure records data
  const seizureRecordsData = [
    {
      id: 'SR-001',
      date: '15-05-2023',
      time: '14:30',
      duration: '2m 15s',
      type: 'Tonic-Clonic',
      intensity: 'Severe'
    },
    {
      id: 'SR-002',
      date: '28-06-2023',
      time: '09:45',
      duration: '1m 35s',
      type: 'Absence',
      intensity: 'Mild'
    },
    {
      id: 'SR-003',
      date: '10-07-2023',
      time: '22:15',
      duration: '3m 05s',
      type: 'Focal',
      intensity: 'Moderate'
    },
    {
      id: 'SR-004',
      date: '19-08-2023',
      time: '03:50',
      duration: '2m 40s',
      type: 'Tonic-Clonic',
      intensity: 'Severe'
    },
    {
      id: 'SR-005',
      date: '05-09-2023',
      time: '17:20',
      duration: '1m 15s',
      type: 'Myoclonic',
      intensity: 'Mild'
    },
    {
      id: 'SR-006',
      date: '22-10-2023',
      time: '11:10',
      duration: '2m 55s',
      type: 'Focal',
      intensity: 'Moderate'
    },
  ];

  // Pagination calculations
  const totalPages = Math.ceil(seizureRecordsData.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = seizureRecordsData.slice(indexOfFirstRecord, indexOfLastRecord);

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

  const toggleMenu = (e, index) => {
    e.stopPropagation();
    if (openMenuIndex === index) {
      setOpenMenuIndex(null);
    } else {
      setOpenMenuIndex(index);
      const rect = e.target.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleAction = (action, id) => {
    console.log(`Action: ${action}, ID: ${id}`);
    setOpenMenuIndex(null);
  };

  return (
    <div className="overview-container">
      <Sidebar />
      <div className="overview-content">
        <div className="overview-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <img src="/chevleft-icon.svg" alt="Back" />
          </button>
          <h1 className="overview-title">Patient Data</h1>
          <HeaderActions />
        </div>

        <div className="patient-data-tables-row">
          <PatientDataTable 
            title="Patient Information" 
            data={patientInfoData} 
          />
          <PatientDataTable 
            title="Medical History" 
            data={medicalHistoryData} 
          />
        </div>
        
        <div className="seizure-records-section">
          <h2 className="section-title">Seizure Records</h2>
          
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Intensity</th>
                  <th>Actions</th> {/* Added a new column header for actions */}
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((record, index) => (
                  <tr key={index}>
                    <td>{record.id}</td>
                    <td>{record.date}</td>
                    <td>{record.time}</td>
                    <td>{record.duration}</td>
                    <td>{record.type}</td>
                    <td>{record.intensity}</td>
                    <td>
                      <button
                        className="dots-button no-border"
                        onClick={(e) => toggleMenu(e, index)}
                      >
                        <img src="/dots.svg" alt="Actions" className="menu-icon" />
                      </button>
                      {openMenuIndex === index && (
                        <div
                          className="floating-dropdown-menu"
                          style={{
                            position: 'fixed',
                            top: `${menuPosition.top - 380}px`, // Adjusted to bring the menu slightly down
                            left: `${menuPosition.left - 20}px`, // Adjusted to bring the menu slightly to the left
                            zIndex: 9999,
                            width: '150px',
                          }}
                        >
                          <div className="dropdown-menu-content">
                            <button onClick={() => handleAction('View', record.id)}>
                              View
                            </button>
                            <button onClick={() => handleAction('Download', record.id)}>
                              Download
                            </button>
                          </div>
                        </div>
                      )}
                    </td> {/* Added a new cell with the 3 dots icon for actions */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <style>
            {`.dots-button {
              border: none; /* Removed border around the dots icon */
              background: transparent;
            }`}
          </style>
          <div className="pagination-bar">
            <button 
              className="pagination-btn chevron"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <img src="/chevleft-icon.svg" alt="Previous Page" />
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
              <img src="/chevright-icon.svg" alt="Next Page" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientData2;
