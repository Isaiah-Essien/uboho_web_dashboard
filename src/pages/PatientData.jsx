import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import LocationPopupFixed from '../components/LocationPopupFixed';
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
        <div className="peak-number">{maxValue}</div>
      </div>
      <div className="peak-bars">
        {data.map((value, index) => (
          <div
            key={index}
            className="peak-bar"
            style={{
              height: `${(value / maxValue) * 40}px`,
              backgroundColor: value === maxValue ? color : '#e0e0e0'
            }}
          />
        ))}
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

const PatientData = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('daily');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const patient = {
    avatar: '/forgotp-img.png',
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: 'No Seizure',
    dateJoined: '2023-03-12',
    id: 'P12345',
    location: [51.505, -0.09],
    emergencyContact: '+1 (555) 123-4567'
  };

  const chartData = (labels, data, color) => ({
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
      pointRadius: 4,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      borderWidth: 2,
      fill: true,
    }]
  });

  const motionLabels = ['0h', '4h', '8h', '12h', '16h', '20h', '24h'];
  const rotationLabels = ['0h', '4h', '8h', '12h', '16h', '20h', '24h'];
  const motionValues = [12, 25, 38, 22, 40, 33, 18];
  const rotationValues = [10, 15, 30, 25, 35, 28, 40];

  const motionData = chartData(motionLabels, motionValues, '#4CAF50');
  const rotationData = chartData(rotationLabels, rotationValues, '#FFC107');

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
          label: (context) => `${context.raw} units`
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
        max: 70,
        grid: { display: false },
        ticks: {
          color: '#666',
          stepSize: 10,
          callback: (value) => `${value}`
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
      alert(`Emergency Contact: ${patient.emergencyContact}`);
    }
    setOpenMenu(false);
  };

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
              <img
                src={patient.avatar}
                alt={patient.name}
                className="settings-avatar"
              />
            </div>
            <div className="settings-user-info">
              <h3 className="settings-name">{patient.name}</h3>
              <p className="settings-email">{patient.email}</p>
              <div className="status-container">
                <span className={`status ${patient.status === 'Seizure' ? 'seizure' : 'no-seizure'}`}>
                  {patient.status}
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
            <p className="graph-description">
              Motion intensity levels measured through accelerometer data
            </p>
            <div className="chart-wrapper">
              <div className="chart-area">
                <Line data={motionData} options={chartOptions} />
              </div>
              <GraphFooter
                data={motionData.datasets[0].data}
                color="#4CAF50"
                onViewRaw={() => navigate("/rawdata", { state: { type: "motion" } })}
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
            <p className="graph-description">
              Rotation activity levels recorded from gyroscope data
            </p>
            <div className="chart-wrapper">
              <div className="chart-area">
                <Line data={rotationData} options={chartOptions} />
              </div>
              <GraphFooter
                data={rotationData.datasets[0].data}
                color="#FFC107"
                onViewRaw={() => navigate("/rawdata", { state: { type: "rotation" } })}
              />
            </div>
          </div>
        </div>

        {showLocationPopup && (
          <LocationPopupFixed
            patientLocation={patient.location}
            emergencyContact={patient.emergencyContact}
            onClose={() => setShowLocationPopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PatientData;
