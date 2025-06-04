import React from 'react';
import Sidebar from '../components/Sidebar'; // ✅ Import Sidebar
import '../Surveillance.css';  // Custom CSS for this page

const Surveillance = () => {
  return (
    <div className="surveillance-page">
      <Sidebar />
      <div className="surveillance-container">
        <div className="surveillance-content">
          <h1 className="surveillance-title">Surveillance Page</h1>
          <p className="surveillance-description">This page is under development.</p>

          {/* Icon Link */}
          <a
            href="https://example.com"
            className="icon-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://cdn.iconscout.com/icon/premium/png-128-thumb/under-development-5101674-4254374.png"
              alt="Under Development Icon"
              className="icon-image"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Surveillance;
