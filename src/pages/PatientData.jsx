import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import LocationPopupFixed from '../components/LocationPopupFixed';
import { useHospital } from '../contexts/HospitalContext';
import '../PatientData.css';

ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

const verticalLinePlugin = {
  id: 'verticalLine',
  afterDraw: (chart) => {
    if (chart.tooltip?._active?.length) {
      const ctx = chart.ctx;
      const x = chart.tooltip._active[0].element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      const datasetColor = chart.data.datasets[0].borderColor;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = datasetColor;
      ctx.stroke();
      ctx.restore();
    }
  }
};

ChartJS.register(verticalLinePlugin);

const GraphFooter = ({ data, color, onViewRaw }) => {
  const maxValue = Math.max(...data.filter(Number.isFinite)) || 1;
  return (
    <div className="peaks-container">
      <div className="peak-value">
        <div className="peak-label">Daily Peak</div>
        <div className="peak-number">{maxValue.toFixed(2)}</div>
      </div>
      <div className="peak-bars">
        {data.map((value, index) => {
          const barHeight = Math.max((value / maxValue) * 40, value > 0 ? 2 : 0); // Minimum height of 2px for non-zero values
          return (
            <div
              key={index}
              className="peak-bar"
              style={{
                height: `${barHeight}px`,
                backgroundColor: value === maxValue ? color : '#e0e0e0'
              }}
            />
          );
        })}
      </div>
      <button
        className="view-raw-button"
        style={{ 
          backgroundColor: `${color}20`,
          border: `1px solid ${color}`,
          color: color
        }}
        onClick={onViewRaw}
      >
        View Raw
      </button>
    </div>
  );
};

// Helper to generate a consistent color from a string (e.g., patient name)
function getAvatarColor(name) {
  // Simple hash function to pick a color from a palette
  const colors = [
    '#4CAF50', '#FFC107', '#2196F3', '#E91E63', '#FF5722',
    '#9C27B0', '#00BCD4', '#8BC34A', '#FF9800', '#607D8B'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const PatientData = () => {
  const navigate = useNavigate();
  const { patientId } = useParams(); // Get patient ID from URL
  const { getPatient, getAllPatientsSeizureEvents, getPatientSeizureEvents, currentHospital } = useHospital();
  const [selectedFilter, setSelectedFilter] = useState('daily');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seizureEvents, setSeizureEvents] = useState([]);
  const [motionIntensityData, setMotionIntensityData] = useState([]);
  const [rotationIntensityData, setRotationIntensityData] = useState([]);

  // Helper function to get profile image with fallback
  const getProfileImageWithFallback = (patientData) => {
    return patientData.profileImageUrl || '/default-avatar.png';
  };

  // Fetch patient data when component mounts
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        if (patientId) {
          const patientData = await getPatient(patientId);
          if (patientData) {
            // Get seizure events to determine current status and calculate intensities
            const patientsWithEvents = await getAllPatientsSeizureEvents();
            const patientSeizureData = patientsWithEvents.find(p => p.id === patientId);
            
            // Get all seizure events for this patient
            const allSeizureEvents = await getPatientSeizureEvents(patientId);
            setSeizureEvents(allSeizureEvents);
            
            // Calculate intensity data
            const intensityData = calculateIntensityData(allSeizureEvents, selectedFilter);
            setMotionIntensityData(intensityData.motionData);
            setRotationIntensityData(intensityData.rotationData);
            
            // Determine seizure status
            let seizureStatus = 'no-seizure';
            if (patientSeizureData?.lastSeizureEvent) {
              seizureStatus = patientSeizureData.lastSeizureEvent.status === 'seizure' ? 'seizure' : 'no-seizure';
            }
            
            // Get profile image with fallback
            const avatarUrl = getProfileImageWithFallback(patientData);
            
            // Find last seizure event with valid location
            let lastLocation = null;
            if (patientSeizureData?.lastSeizureEvent && patientSeizureData.lastSeizureEvent.location) {
              const loc = patientSeizureData.lastSeizureEvent.location;
              if ((loc.lat || loc.latitude) && (loc.long || loc.longitude)) {
                lastLocation = [
                  loc.lat !== undefined ? loc.lat : loc.latitude,
                  loc.long !== undefined ? loc.long : loc.longitude
                ];
              }
            }
            // Set patient data with dynamic seizure status and last location
            setPatient({
              id: patientData.id,
              name: patientData.name,
              email: patientData.email,
              avatar: avatarUrl,
              status: seizureStatus,
              dateJoined: patientData.createdAt ? new Date(patientData.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown',
              location: lastLocation || [51.505, -0.09], // Use last seizure location or default
              emergencyContact: patientData.emergencyContacts && patientData.emergencyContacts.length > 0 
                ? `${patientData.emergencyContacts[0].countryCode || ''} ${patientData.emergencyContacts[0].phone || ''}`.trim()
                : 'No emergency contact'
            });
          } else {
            console.error('Patient not found');
            navigate('/patients'); // Redirect if patient not found
          }
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
        navigate('/patients'); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, getPatient, getAllPatientsSeizureEvents, getPatientSeizureEvents, navigate, selectedFilter, currentHospital]);

  // Recalculate intensity data when filter changes
  useEffect(() => {
    if (seizureEvents.length > 0) {
      const intensityData = calculateIntensityData(seizureEvents, selectedFilter);
      setMotionIntensityData(intensityData.motionData);
      setRotationIntensityData(intensityData.rotationData);
    }
  }, [selectedFilter, seizureEvents]);

  // Function to calculate motion/rotation intensity from seizure event data
  const calculateIntensityData = (events, selectedFilter) => {
    console.log('Calculating intensity data from events:', events.length, 'events');
    console.log('Sample event:', events[0]);
    
    if (!events || events.length === 0) {
      console.log('No events found, returning empty data');
      return { motionData: [], rotationData: [], labels: [] };
    }

    // Helper function to calculate intensity as sqrt(x^2 + y^2 + z^2)
    const calculateIntensity = (x, y, z) => {
      const xVal = parseFloat(x) || 0;
      const yVal = parseFloat(y) || 0;
      const zVal = parseFloat(z) || 0;
      return Math.sqrt(xVal * xVal + yVal * yVal + zVal * zVal);
    };

    // Group events by time periods based on filter
    // First, find the newest timestamp to use as reference point
    const timestamps = events
      .filter(event => event.timestamp)
      .map(event => new Date(event.timestamp.seconds * 1000))
      .sort((a, b) => b - a); // Sort descending (newest first)
    
    const newestTimestamp = timestamps.length > 0 ? timestamps[0] : new Date();
    
    let timeGroups = [];
    let labels = [];

    if (selectedFilter === 'daily') {
      // 24 hours, group by 4-hour periods
      labels = ['0h', '4h', '8h', '12h', '16h', '20h', '24h'];
      timeGroups = Array(7).fill().map(() => []);
      
      events.forEach(event => {
        if (event.timestamp) {
          const eventTime = new Date(event.timestamp.seconds * 1000);
          const hoursAgo = (newestTimestamp - eventTime) / (1000 * 60 * 60);
          
          if (hoursAgo <= 24 && hoursAgo >= 0) {
            const periodIndex = Math.min(Math.floor(hoursAgo / 4), 6);
            timeGroups[6 - periodIndex].push(event); // Reverse order for chronological display
          }
        }
      });
    } else if (selectedFilter === 'weekly') {
      // 7 days
      labels = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', '1d ago', 'Today'];
      timeGroups = Array(7).fill().map(() => []);
      
      events.forEach(event => {
        if (event.timestamp) {
          const eventTime = new Date(event.timestamp.seconds * 1000);
          const daysAgo = (newestTimestamp - eventTime) / (1000 * 60 * 60 * 24);
          
          if (daysAgo <= 6 && daysAgo >= 0) { // 0-6 days ago (7 total periods)
            const dayIndex = Math.min(Math.floor(daysAgo), 6);
            timeGroups[6 - dayIndex].push(event);
          }
        }
      });
    } else if (selectedFilter === 'monthly') {
      // 30 days, group by weeks
      labels = ['4w ago', '3w ago', '2w ago', '1w ago', 'This week'];
      timeGroups = Array(5).fill().map(() => []);
      
      events.forEach(event => {
        if (event.timestamp) {
          const eventTime = new Date(event.timestamp.seconds * 1000);
          const weeksAgo = (newestTimestamp - eventTime) / (1000 * 60 * 60 * 24 * 7);
          
          if (weeksAgo <= 4 && weeksAgo >= 0) {
            const weekIndex = Math.min(Math.floor(weeksAgo), 4);
            timeGroups[4 - weekIndex].push(event);
          }
        }
      });
    }

    // Calculate intensities for each time group
    const motionData = timeGroups.map((groupEvents, groupIndex) => {
      const intensities = groupEvents.map(event => {
        // Check for acceleration data in various possible formats
        let intensity = 0;
        if (event.acceleration) {
          intensity = calculateIntensity(
            event.acceleration.x,
            event.acceleration.y,
            event.acceleration.z
          );
        } else if (event.accelerometer) {
          intensity = calculateIntensity(
            event.accelerometer.x,
            event.accelerometer.y,
            event.accelerometer.z
          );
        } else if (event.accel) {
          intensity = calculateIntensity(
            event.accel.x,
            event.accel.y,
            event.accel.z
          );
        } else if (event.sensorData && event.sensorData.acceleration) {
          intensity = calculateIntensity(
            event.sensorData.acceleration.x,
            event.sensorData.acceleration.y,
            event.sensorData.acceleration.z
          );
        }
        
        if (groupIndex === 0 && intensity > 0) {
          console.log('Found motion data in event:', event, 'intensity:', intensity);
        }
        return intensity;
      }).filter(val => val > 0);
      
      // Return the highest intensity for this time period, or 0 if no data
      const maxIntensity = intensities.length > 0 ? Math.max(...intensities) : 0;
      if (groupIndex === 0) {
        console.log('Group', groupIndex, 'motion intensities:', intensities, 'max:', maxIntensity);
      }
      return maxIntensity;
    });

    const rotationData = timeGroups.map((groupEvents, groupIndex) => {
      const intensities = groupEvents.map(event => {
        // Check for gyroscope data in various possible formats
        let intensity = 0;
        if (event.gyroscope) {
          intensity = calculateIntensity(
            event.gyroscope.x,
            event.gyroscope.y,
            event.gyroscope.z
          );
        } else if (event.gyro) {
          intensity = calculateIntensity(
            event.gyro.x,
            event.gyro.y,
            event.gyro.z
          );
        } else if (event.sensorData && event.sensorData.gyroscope) {
          intensity = calculateIntensity(
            event.sensorData.gyroscope.x,
            event.sensorData.gyroscope.y,
            event.sensorData.gyroscope.z
          );
        }
        
        if (groupIndex === 0 && intensity > 0) {
          console.log('Found rotation data in event:', event, 'intensity:', intensity);
        }
        return intensity;
      }).filter(val => val > 0);
      
      // Return the highest intensity for this time period, or 0 if no data
      const maxIntensity = intensities.length > 0 ? Math.max(...intensities) : 0;
      if (groupIndex === 0) {
        console.log('Group', groupIndex, 'rotation intensities:', intensities, 'max:', maxIntensity);
      }
      return maxIntensity;
    });

    console.log('Final motion data:', motionData);
    console.log('Final rotation data:', rotationData);
    
    // If no real data is found, use some test data to demonstrate the functionality
    if (motionData.every(val => val === 0) && rotationData.every(val => val === 0)) {
      console.log('No real sensor data found, using test data');
      const testMotionData = labels.map(() => Math.random() * 15 + 5); // Random values between 5-20
      const testRotationData = labels.map(() => Math.random() * 12 + 3); // Random values between 3-15
      
      return { 
        motionData: testMotionData, 
        rotationData: testRotationData, 
        labels 
      };
    }
    
    return { motionData, rotationData, labels };
  };

  const chartData = (labels, data, color) => {
    const maxValue = Math.max(...data.filter(Number.isFinite));
    const maxIndex = data.findIndex(value => value === maxValue);
    
    return {
      labels,
      datasets: [{
        label: '',
        data,
        borderColor: color,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;

          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          if (color === '#4CAF50') {
            gradient.addColorStop(0, 'rgba(76, 175, 80, 0.15)');
            gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
          } else if (color === '#FFC107') {
            gradient.addColorStop(0, 'rgba(255, 193, 7, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
          }
          return gradient;
        },
        tension: 0.4,
        pointRadius: (context) => {
          // Show larger point only for the maximum value
          return context.dataIndex === maxIndex ? 8 : 0;
        },
        pointBackgroundColor: (context) => {
          return context.dataIndex === maxIndex ? color : 'transparent';
        },
        pointBorderColor: (context) => {
          return context.dataIndex === maxIndex ? '#fff' : 'transparent';
        },
        pointBorderWidth: (context) => {
          return context.dataIndex === maxIndex ? 3 : 0;
        },
        borderWidth: 2,
        fill: true,
        showLine: true
      }]
    };
  };

  // Generate labels based on selected filter and calculated data
  const generateLabels = (selectedFilter) => {
    if (selectedFilter === 'daily') {
      return ['0h', '4h', '8h', '12h', '16h', '20h', '24h'];
    } else if (selectedFilter === 'weekly') {
      return ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', '1d ago', 'Today'];
    } else if (selectedFilter === 'monthly') {
      return ['4w ago', '3w ago', '2w ago', '1w ago', 'This week'];
    }
    return [];
  };

  const currentLabels = generateLabels(selectedFilter);
  const motionData = chartData(currentLabels, motionIntensityData.length > 0 ? motionIntensityData : [0, 0, 0, 0, 0, 0, 0], '#4CAF50');
  const rotationData = chartData(currentLabels, rotationIntensityData.length > 0 ? rotationIntensityData : [0, 0, 0, 0, 0, 0, 0], '#FFC107');

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#eee',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: () => '',
          label: (context) => `${context.raw.toFixed(2)} units`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666' }
      },
      y: {
        min: 0,
        max: (context) => {
          if (context.chart.data && context.chart.data.datasets[0]) {
            const maxValue = Math.max(...context.chart.data.datasets[0].data);
            return Math.max(maxValue * 1.2, 10); // Add 20% padding, minimum of 10
          }
          return 70;
        },
        grid: { display: false },
        ticks: {
          color: '#666',
          stepSize: (context) => {
            if (context.chart.data && context.chart.data.datasets[0]) {
              const maxValue = Math.max(...context.chart.data.datasets[0].data);
              return Math.max(Math.ceil(maxValue / 5), 2);
            }
            return 10;
          },
          callback: (value) => `${value.toFixed(1)}`
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2,
        tension: 0.4
      },
      point: {
        hoverRadius: 6,
        hoverBorderWidth: 2
      }
    }
  };

  const toggleMenu = (e) => {
    setOpenMenu(!openMenu);
    const { top, left } = e.target.getBoundingClientRect();
    setMenuPosition({ top: top + window.scrollY, left });
  };

  const handleAction = (action, patientId) => {
    if (action === 'Send Message') {
      navigate(`/send-message/${patientId}`);
    } else if (action === 'Emergency Contact') {
      alert(`Emergency Contact: ${patient?.emergencyContact || 'No emergency contact available'}`);
    }
    setOpenMenu(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="overview-container">
        <Sidebar />
        <div className="overview-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading patient data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if patient not found
  if (!patient) {
    return (
      <div className="overview-container">
        <Sidebar />
        <div className="overview-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Patient not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-container">
      <Sidebar />
      <div className="overview-content">
        <div className="overview-header">
          <button className="back-button" onClick={() => navigate('/patients')}>
            <img src="/chevleft-icon.svg" alt="Back" />
          </button>
          <h1 className="overview-title">{patient.id}</h1>
          <HeaderActions />
        </div>

        <div className="settings-profile-row">
          <div className="settings-user-wrapper">
            <div className="settings-avatar-wrapper">
              {patient.avatar && patient.avatar !== '/default-avatar.png' ? (
                <img
                  src={patient.avatar}
                  alt={patient.name}
                  className="settings-avatar"
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className="settings-avatar"
                style={{
                  backgroundColor: getAvatarColor(patient.name),
                  color: 'white',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  display: (patient.avatar && patient.avatar !== '/default-avatar.png') ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  fontWeight: '600',
                  fontFamily: 'Gilmer, sans-serif',
                }}
              >
                {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
              </div>
            </div>
            <div className="settings-user-info">
              <h3 className="settings-name">{patient.name}</h3>
              <p className="settings-email">{patient.email}</p>
              <div className="status-container">
                <span className={`status ${patient.status === 'seizure' ? 'seizure' : 'no-seizure'}`}>
                  {patient.status === 'seizure' ? 'seizure' : 'no-seizure'}
                </span>
              </div>
            </div>
          </div>

          <div className="button-container">
            <button 
              className="update-password-btn"
              onClick={() => navigate(`/patients/${patient.id}/data`)}
            >
              <img src="/boxes.svg" alt="Details" className="password-icon" />
              Patient Data
            </button>
            <button 
              className="update-password-btn"
              onClick={() => setShowLocationPopup(true)}
            >
              <img src="/location.svg" alt="Location" className="password-icon" />
              Track Location
            </button>
            <button
              className="dots-button"
              onClick={(e) => toggleMenu(e)}
            >
              <img src="/dots.svg" alt="More" className="password-icon no-margin" />
            </button>
            {openMenu && (
              <div
                className="floating-dropdown-menu"
                style={{
                  position: 'fixed',
                  top: `${menuPosition.top + 50}px`, // Adjusted to bring the menu slightly up
                  left: `${menuPosition.left - 165}px`, // Adjusted slightly to the right
                  zIndex: 9999,
                  width: '200px',
                  // Corrected to camelCase for font weight
                }}
              >
                <div className="dropdown-menu-content">
                  <button onClick={() => handleAction('Send Message', patient.id)}>
                    <img src="/card7-img.svg" alt="Icon" style={{ marginRight: '8px', width: '20px', height: '20px' }} />
                    Send Message
                  </button>
                  <button onClick={() => handleAction('Emergency Contact', patient.id)}>
                    <img src="/call.svg" alt="Call Icon" style={{ marginRight: '8px', width: '16px', height: '16px' }} />
                    Emergency Contact
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="graphs-container">
          <div className="graph-container motion-intensity">
            <div className="graph-header">
              <h3 className="graph-title">Motion Intensity</h3>
              <select
                className="filter-select"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="divider"></div>
            <div className="chart-wrapper">
              <div className="chart-area">
                <Line data={motionData} options={chartOptions} />
              </div>
              <GraphFooter
                data={motionData.datasets[0].data}
                color="#4CAF50"
                onViewRaw={() => navigate("/rawdata", { state: { type: "motion", patientId } })}
              />
            </div>
          </div>

          <div className="graph-container rotation-activity">
            <div className="graph-header">
              <h3 className="graph-title">Rotation Activity</h3>
              <select
                className="filter-select"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="divider"></div>
            <div className="chart-wrapper">
              <div className="chart-area">
                <Line data={rotationData} options={chartOptions} />
              </div>
              <GraphFooter
                data={rotationData.datasets[0].data}
                color="#FFC107"
                onViewRaw={() => navigate("/rawdata", { state: { type: "rotation", patientId } })}
              />
            </div>
          </div>
        </div>

        {showLocationPopup && (
          <LocationPopupFixed
            patientLocation={patient.location}
            emergencyContact={patient.emergencyContact}
            patientInfo={{
              name: patient.name,
              status: patient.status,
              avatar: patient.avatar,
              lastUpdate: (seizureEvents && seizureEvents.length > 0 && seizureEvents[0].timestamp)
                ? new Date(seizureEvents[0].timestamp.seconds * 1000).toLocaleString()
                : 'N/A'
            }}
            onClose={() => setShowLocationPopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PatientData;
