import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import MessageBox from '../components/messages/MessageBox';
import DataTable from '../components/tables/DataTable';
import { useHospital } from '../contexts/HospitalContext'; // Import useHospital
import '../overview.css';
import '../Patients.css';
import '../RawData.css';

const RawData = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getPatientSensorData } = useHospital(); // Use single patient function
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);

  const graphType = location.state?.type || 'motion'; // fallback to motion
  const patientId = location.state?.patientId; // Get patient ID from navigation state
  const title = graphType === 'rotation' ? 'Rotation Activity' : 'Motion Intensity';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (patientId) {
          const data = await getPatientSensorData(patientId);
          setSensorData(data ? [data] : []); // Wrap single patient data in array for table
        } else {
          setSensorData([]);
        }
      } catch (error) {
        console.error("Error fetching sensor data:", error);
        setSensorData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getPatientSensorData, patientId]);

  const columns = React.useMemo(() => {
    const baseColumns = [
      { 
        Header: 'Date', 
        accessor: 'timestamp',
        Cell: ({ value }) => {
          if (!value) return 'N/A';
          // Handle both Firestore timestamp and number timestamp
          const date = typeof value === 'number' ? new Date(value) : new Date(value.seconds * 1000);
          return date.toLocaleDateString();
        }
      },
      { 
        Header: 'Time', 
        accessor: 'timestamp',
        Cell: ({ value }) => {
          if (!value) return 'N/A';
          // Handle both Firestore timestamp and number timestamp
          const date = typeof value === 'number' ? new Date(value) : new Date(value.seconds * 1000);
          return date.toLocaleTimeString();
        }
      },
    ];

    if (graphType === 'rotation') {
      return [
        ...baseColumns,
        { Header: 'Gyro X', accessor: 'x_gyro' },
        { Header: 'Gyro Y', accessor: 'y_gyro' },
        { Header: 'Gyro Z', accessor: 'z_gyro' },
      ];
    } else { // Motion
      return [
        ...baseColumns,
        { Header: 'Accel X', accessor: 'x_accel' },
        { Header: 'Accel Y', accessor: 'y_accel' },
        { Header: 'Accel Z', accessor: 'z_accel' },
      ];
    }
  }, [graphType]);


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
          {loading ? (
            <p>Loading data...</p>
          ) : (
            <DataTable data={sensorData} columns={columns} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RawData;
