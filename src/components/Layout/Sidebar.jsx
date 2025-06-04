import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './styles/Sidebar.css';

const navItems = [
  {
    section: 'DASHBOARD',
    links: [
      { to: '/overview', label: 'Overview', iconInactive: '/Overv-off.svg', iconActive: '/Overv-on.svg' },
      { to: '/patients', label: 'Patients', iconInactive: '/Patients-off.svg', iconActive: '/card1-img.svg' },
      { to: '/surveillance', label: 'Surveillance Alert', iconInactive: '/Surv-off.svg', iconActive: '/Surv-on.svg' },
      { to: '/messages', label: 'Messages', iconInactive: '/Mess-off.svg', iconActive: '/card3-img.svg' },
    ]
  },
  {
    section: 'SYSTEM',
    links: [
      { to: '/admin', label: 'Admins', iconInactive: '/admin-off.svg', iconActive: '/admin-on.svg' },
      { to: '/settings', label: 'Settings', iconInactive: '/sett-off.svg', iconActive: '/sett-on.svg' },
      { to: '/logs', label: 'Logout', iconInactive: '/logout-off.svg', iconActive: '/logout-on.svg' },
    ]
  }
];

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside className={`sidebar ${isMobile ? 'collapsed' : ''}`}>
      <div className="logo-container">
        <img 
          src={isMobile ? "/Logo2.svg" : "/Logo1.svg"} 
          alt="Logo" 
          className={isMobile ? 'mobile-logo' : 'desktop-logo'}
        />
      </div>

      <nav>
        {navItems.map((section, idx) => (
          <div className="nav-section" key={idx}>
            <h4 className="section-title">{section.section}</h4>
            <ul>
              {section.links.map((link, index) => {
                const isActive = location.pathname.startsWith(link.to);
                return (
                  <li key={index}>
                    <Link
                      to={link.to}
                      className={`link ${isActive ? 'active' : ''}`}
                    >
                      <img
                        src={isActive ? link.iconActive : link.iconInactive}
                        alt={`${link.label} icon`}
                        className="link-icon"
                      />
                      <span className="link-text">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {idx < navItems.length - 1 && <div className="divider" />}
          </div>
        ))}
      </nav>

      <div className="divider" />

      <div className="profile-section">
        <img src="/login-img.png" alt="Profile" className="profile-pic" />
        {!isMobile && <span className="username">John Doe</span>}
      </div>
    </aside>
  );
};

export default Sidebar;
