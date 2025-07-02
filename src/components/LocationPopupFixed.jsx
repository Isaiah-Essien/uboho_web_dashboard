import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LocationPopupFixed = ({ patientLocation, emergencyContact, onClose, patientInfo }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Google Maps link
  const mapsLink = patientLocation && patientLocation.length === 2
    ? `https://www.google.com/maps?q=${patientLocation[0]},${patientLocation[1]}`
    : null;

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView(patientLocation, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      // Custom popup content for the marker (no avatar)
      const popupContent = `
        <div style="text-align:center;min-width:180px;max-width:220px;">
          <div style='font-weight:600;font-size:16px;margin-bottom:4px;'>${patientInfo?.name || 'Patient'}</div>
          <div style='margin-bottom:4px;'><strong>Status:</strong> ${patientInfo?.status === 'seizure' ? 'Seizure Alert' : 'Normal'}</div>
          <div style='margin-bottom:4px;'><strong>Emergency Contact:</strong><br/>${emergencyContact}</div>
          <div style='font-size:12px;color:#666;margin-bottom:4px;'>Last update: ${patientInfo?.lastUpdate || 'N/A'}</div>
          ${mapsLink ? `<a href='${mapsLink}' target='_blank' rel='noopener noreferrer' style='color:#4caf50;text-decoration:none;'>View on Google Maps</a>` : ''}
        </div>
      `;
      L.marker(patientLocation)
        .addTo(map)
        .bindPopup(popupContent)
        .openPopup();
      mapRef.current = map;
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [patientLocation, patientInfo, emergencyContact, mapsLink]);

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
