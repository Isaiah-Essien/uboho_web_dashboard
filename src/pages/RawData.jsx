import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import MessageBox from '../components/messages/MessageBox';
import DataTable from '../components/tables/DataTable';
import '../overview.css';
import '../Patients.css';
import '../RawData.css';

const RawData = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const graphType = location.state?.type || 'motion'; // fallback to motion
  const title = graphType === 'rotation' ? 'Rotation Activity' : 'Motion Intensity';

  const sensorData = [
    {
      date: '2025-05-18',
      time: '14:30:00',
      gyroX: 0.12,
      gyroY: -0.45,
      gyroZ: 0.89,
      rotationActivity: 'Low',
      classes: 'Class A',
    },
    {
      date: '2025-05-18',
      time: '14:31:00',
      gyroX: 0.10,
      gyroY: -0.40,
      gyroZ: 0.80,
      rotationActivity: 'Medium',
      classes: 'Class B',
    },
    // Add more rows here
  ];

  return (
    <div className="overview-container">
      <Sidebar />
      <div className="overview-content">
        <div className="raw-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <img src="/chevleft-icon.svg" alt="Back" />
          </button>
          <h1 className="raw-title">{title}</h1>
          <HeaderActions />
        </div>

        <MessageBox
          title="Raw Sensor Data"
          text="Below is the unprocessed sensor data collected from the device. You can download the full dataset or customize the columns for viewing."
        />

        <div className="raw-actions-row">
          <button className="download-button">Download Data</button>
          <button className="columns-button">Columns</button>
        </div>

        {/* Table added here */}
        <div className="raw-table-wrapper">
          <DataTable data={sensorData} />
        </div>
      </div>
    </div>
  );
};

export default RawData;
