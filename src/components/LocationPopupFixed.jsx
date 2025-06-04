import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LocationPopupFixed = ({ patientLocation, emergencyContact, onClose }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView(patientLocation, 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      L.marker(patientLocation)
        .addTo(map)
        .bindPopup('Patient Location')
        .openPopup();

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [patientLocation]);

  return (
    <div className="location-popup-overlay" onClick={onClose}>
      <div className="location-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-left-column">
          <img
            src="/forgotp-img.png"
            alt="Patient Avatar"
            className="popup-avatar"
          />
          <button
            className="emergency-contact-btn"
            onClick={() => {
              alert(`Calling emergency contact: ${emergencyContact}`);
              navigator.clipboard.writeText(emergencyContact);
            }}
          >
            Emergency Contact
          </button>
        </div>
        <div className="popup-right-column" ref={mapContainerRef} />
      </div>
    </div>
  );
};

export default LocationPopupFixed;
