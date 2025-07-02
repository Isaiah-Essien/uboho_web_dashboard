import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getProfileImageUrl } from '../services/profileImageService';
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
      { to: '/logs', label: 'Logout', iconInactive: '/logout-off.svg', iconActive: '/logout-on.svg', isLogout: true },
    ]
  }
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  // Helper function to get the first initial from a name
  const getInitial = (name) => {
    if (!name) return 'U'; // Default to 'U' for Unknown User
    return name.charAt(0).toUpperCase();
  };

  // Helper function to generate a consistent color based on the name
  const getAvatarColor = (name) => {
    if (!name) return '#6c757d'; // Default gray color
    
    // Array of nice colors for avatars
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', 
      '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#17a2b8', 
      '#343a40', '#6610f2'
    ];
    
    // Generate a consistent index based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use absolute value and modulo to get a valid index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Fetch profile image when user changes
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (currentUser) {
        try {
          const imageUrl = await getProfileImageUrl(currentUser.uid, 'admins', null);
          setProfileImageUrl(imageUrl);
        } catch (error) {
          console.log('No profile image found for user:', currentUser.uid);
          setProfileImageUrl(null);
        }
      }
    };

    fetchProfileImage();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

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
                    {link.isLogout ? (
                      <button
                        onClick={handleLogout}
                        className={`link ${isActive ? 'active' : ''}`}
                      >
                        <img
                          src={isActive ? link.iconActive : link.iconInactive}
                          alt={`${link.label} icon`}
                          className="link-icon"
                        />
                        <span className="link-text">{link.label}</span>
                      </button>
                    ) : (
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
                    )}
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
        <div className="profile-pic-container">
          {profileImageUrl ? (
            <img 
              src={profileImageUrl} 
              alt="Profile" 
              className="profile-pic"
              onError={() => setProfileImageUrl(null)} // Fallback to initial avatar on error
            />
          ) : (
            <div 
              className="profile-pic initial-avatar"
              style={{ 
                backgroundColor: getAvatarColor(currentUser?.displayName || currentUser?.email),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {getInitial(currentUser?.displayName || currentUser?.email)}
            </div>
          )}
        </div>
        {!isMobile && (
          <span className="username">
            {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
          </span>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
