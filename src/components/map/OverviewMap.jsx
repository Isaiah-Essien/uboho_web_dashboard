import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useHospital } from '../../contexts/HospitalContext';

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

const OverviewMap = () => {
  const [map, setMap] = useState(null);
  const [patientLocations, setPatientLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef(null);
  const { getAllPatientsSeizureEvents } = useHospital();

  // Fetch patient data with seizure events
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const patientsWithEvents = await getAllPatientsSeizureEvents();
        console.log('Patients with seizure events:', patientsWithEvents);
        
        const patientData = patientsWithEvents
          .filter(patient => {
            const hasSeizureEvent = patient.lastSeizureEvent && patient.lastSeizureEvent.location;
            console.log(`Patient ${patient.name}: has seizure event = ${!!patient.lastSeizureEvent}, has location = ${!!(patient.lastSeizureEvent && patient.lastSeizureEvent.location)}`);
            if (patient.lastSeizureEvent) {
              console.log(`${patient.name} seizure event data:`, patient.lastSeizureEvent);
            }
            return hasSeizureEvent;
          })
          .map(patient => {
            const event = patient.lastSeizureEvent;
            const emergencyContact = patient.emergencyContacts && patient.emergencyContacts.length > 0 
              ? patient.emergencyContacts[0] 
              : null;

            // Calculate time since last update
            const lastUpdateTime = event.timestamp 
              ? (event.timestamp.seconds ? new Date(event.timestamp.seconds * 1000) : new Date(event.timestamp))
              : new Date();
            const now = new Date();
            const timeDiff = Math.floor((now - lastUpdateTime) / (1000 * 60)); // minutes
            
            let lastUpdateText;
            if (timeDiff < 1) {
              lastUpdateText = 'Just now';
            } else if (timeDiff < 60) {
              lastUpdateText = `${timeDiff} minute${timeDiff !== 1 ? 's' : ''} ago`;
            } else {
              const hoursDiff = Math.floor(timeDiff / 60);
              lastUpdateText = `${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''} ago`;
            }

            return {
              id: patient.id,
              name: patient.name,
              position: [event.location.latitude, event.location.longitude],
              hasSeizure: event.status === 'seizure',
              emergencyContact: emergencyContact ? {
                name: emergencyContact.name,
                phone: `${emergencyContact.countryCode || ''} ${emergencyContact.phone || ''}`.trim()
              } : {
                name: 'No emergency contact',
                phone: ''
              },
              lastUpdate: lastUpdateText,
              mapsLink: event.mapsLink
            };
          });

        setPatientLocations(patientData);
      } catch (error) {
        console.error('Error fetching patient location data:', error);
        setPatientLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [getAllPatientsSeizureEvents]);

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
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#fff',
          fontSize: '16px'
        }}>
          Loading patient locations...
        </div>
      ) : (
        <MapContainer
          center={patientLocations.length > 0 ? patientLocations[0].position : [51.505, -0.09]}
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
          
          {patientLocations.length > 0 ? (
            patientLocations.map((patient) => (
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
                    {patient.mapsLink && (
                      <p style={{ margin: '4px 0' }}>
                        <a 
                          href={patient.mapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#4caf50', textDecoration: 'none' }}
                        >
                          View on Google Maps
                        </a>
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))
          ) : (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              color: '#666',
              fontSize: '16px',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '20px',
              borderRadius: '8px'
            }}>
              No patient locations available
            </div>
          )}
        </MapContainer>
      )}
    </div>
  );
};

export default OverviewMap;