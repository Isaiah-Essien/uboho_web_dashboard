import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different patient states
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const seizureIcon = createCustomIcon('#ff4444'); // Red for seizure
const normalIcon = createCustomIcon('#4caf50'); // Green for normal

// Sample patient locations
const patientLocations = [
  {
    id: 1,
    name: 'John Doe',
    position: [51.505, -0.09],
    hasSeizure: true,
    emergencyContact: {
      name: 'Sarah Doe',
      phone: '+1 (555) 123-4567'
    },
    lastUpdate: '2 minutes ago'
  },
  {
    id: 2,
    name: 'Jane Smith',
    position: [51.51, -0.1],
    hasSeizure: false,
    emergencyContact: {
      name: 'Mike Smith',
      phone: '+1 (555) 987-6543'
    },
    lastUpdate: '5 minutes ago'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    position: [51.49, -0.08],
    hasSeizure: false,
    emergencyContact: {
      name: 'Lisa Johnson',
      phone: '+1 (555) 456-7890'
    },
    lastUpdate: '1 minute ago'
  },
  {
    id: 4,
    name: 'Alice Wilson',
    position: [51.515, -0.095],
    hasSeizure: true,
    emergencyContact: {
      name: 'Tom Wilson',
      phone: '+1 (555) 234-5678'
    },
    lastUpdate: 'Just now'
  }
];

const OverviewMap = () => {
  const [map, setMap] = useState(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Any additional map setup can go here
    if (map) {
      // Map is ready - invalidate size to ensure proper dimensions
      console.log('Map initialized');
      
      // Small delay to ensure container dimensions are stable
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map]);

  // Handle container resize
  useEffect(() => {
    if (!map || !mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Invalidate map size when container is resized
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return (
    <div ref={mapContainerRef} className="overview-map-container">
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        className="overview-map"
        whenCreated={setMap}
        doubleClickZoom={true}
        dragging={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {patientLocations.map((patient) => (
          <Marker
            key={patient.id}
            position={patient.position}
            icon={patient.hasSeizure ? seizureIcon : normalIcon}
            eventHandlers={{
              click: (e) => {
                // Prevent map panning when clicking on marker
                e.originalEvent.stopPropagation();
              }
            }}
          >
            <Popup
              closeButton={true}
              autoClose={false}
              closeOnClick={false}
              className="custom-popup"
            >
              <div style={{ color: '#333', fontSize: '14px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: patient.hasSeizure ? '#ff4444' : '#4caf50' }}>
                  {patient.name}
                </h4>
                <p style={{ margin: '4px 0' }}>
                  <strong>Status:</strong> {patient.hasSeizure ? 'Seizure Alert' : 'Normal'}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Emergency Contact:</strong><br />
                  {patient.emergencyContact.name}<br />
                  {patient.emergencyContact.phone}
                </p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                  Last update: {patient.lastUpdate}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default OverviewMap;