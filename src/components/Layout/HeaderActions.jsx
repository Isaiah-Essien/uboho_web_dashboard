// src/components/HeaderActions.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { performGlobalSearch } from '../utils/searchUtils';
import './styles/HeaderActions.css';

const HeaderActions = ({ onSearch }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New message from John", time: "2 min ago", read: false },
    { id: 2, message: "Your order has been shipped", time: "1 hour ago", read: false },
    { id: 3, message: "Welcome to Uboho!", time: "2 hours ago", read: true },
  ]);
  
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const searchTimeout = useRef(null);

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (query.trim()) {
      setIsSearching(true);
      
      // Set a timeout to avoid searching on every keystroke
      searchTimeout.current = setTimeout(async () => {
        try {
          // Use the actual search utility for real search functionality
          const results = await performGlobalSearch(query);
          setSearchResults(results);
          setShowSearchResults(true);
          setIsSearching(false);
        } catch (error) {
          console.error("Search error:", error);
          setIsSearching(false);
          
          // Fallback to direct search in case of error
          const fallbackResults = [
            { id: 'overview', title: 'Overview', path: '/overview', icon: '/Overv-on.svg', type: 'page' },
            { id: 'patients', title: 'Patients', path: '/patients', icon: '/Patients-off.svg', type: 'page' },
            { id: 'messages', title: 'Messages', path: '/messages', icon: '/Mess-off.svg', type: 'page' },
            { id: 'admin', title: 'Admin Dashboard', path: '/admin', icon: '/admin-on.svg', type: 'page' }
          ];
          setSearchResults(fallbackResults);
          setShowSearchResults(true);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
    
    setActiveResultIndex(-1);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (searchQuery.trim()) {
      // If we have an active selection, navigate to that
      if (activeResultIndex >= 0 && activeResultIndex < searchResults.length) {
        navigateToResult(searchResults[activeResultIndex]);
        return;
      }
      
      // Otherwise, call parent component's search function if provided
      if (onSearch) {
        onSearch(searchQuery);
      }
      
      console.log('Searching for:', searchQuery);
      
      // If we have any results, navigate to the first one
      if (searchResults.length > 0) {
        navigateToResult(searchResults[0]);
      }
    }
  };

  // Handle keyboard navigation in search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveResultIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveResultIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
    }
  };

  // Toggle notification dropdown
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    // Close search results when opening notifications
    if (!showNotifications) {
      setShowSearchResults(false);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Navigate to a search result
  const navigateToResult = (result) => {
    if (!result) return;
    
    navigate(result.path);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Debug mode (set to false to hide debugging info)
  const DEBUG_MODE = false;

  return (
    <div className="header-actions" style={{ position: 'relative', isolation: 'isolate' }}> 
      {DEBUG_MODE && (
        <div style={{ 
          position: 'absolute', 
          top: '-20px', 
          right: '0', 
          color: 'lime', 
          fontSize: '10px', 
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '2px 5px', 
          borderRadius: '3px',
          zIndex: 99999 
        }}>
          Search: {showSearchResults ? 'VISIBLE' : 'HIDDEN'}, 
          Notifications: {showNotifications ? 'VISIBLE' : 'HIDDEN'},
          Results: {searchResults.length}
        </div>
      )}
      
      {/* Search Bar with Results Dropdown */}
      <div 
        className="searchbar-container" 
        ref={searchRef} 
        style={{ position: 'relative', zIndex: 99999, isolation: 'isolate', width: '400px' }}
      >
        <div className="searchbar" style={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          <input
            type="text"
            placeholder="Search anything in Uboho..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
            style={{ backgroundColor: 'transparent', color: '#fff' }}
          />
          <img 
            src="/Search-icon.svg" 
            alt="Search" 
            className="search-icon"
            onClick={handleSearchSubmit}
            style={{ cursor: 'pointer', filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Search Results Dropdown - Only show when we should */}
        {showSearchResults && searchQuery.trim() && (
          <div className="search-results-dropdown" style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            backgroundColor: '#1e1e1e',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)',
            zIndex: 999999,
            maxHeight: '400px',
            overflow: 'hidden'
          }}>
            {/* Loading State */}
            {isSearching && (
              <div className="search-loading">
                <div className="search-spinner"></div>
                <p>Searching...</p>
              </div>
            )}
            
            {/* Results List */}
            {!isSearching && searchResults.length > 0 && (
              <div className="search-results-list">
                {searchResults.map((result, index) => (
                  <div 
                    key={`${result.type}-${result.id}`}
                    className={`search-result-item ${index === activeResultIndex ? 'active' : ''}`}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setActiveResultIndex(index)}
                  >
                    <div className="search-result-icon">
                      <img src={result.icon} alt="" />
                    </div>
                    <div className="search-result-content">
                      <p className="search-result-title">{result.type === 'page' ? result.title : result.name}</p>
                      <span className="search-result-type">{result.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* No Results Message */}
            {!isSearching && searchResults.length === 0 && (
              <div className="no-results">
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Icon with Dropdown */}
      <div className="notif-container" ref={notificationRef} style={{ position: 'relative', zIndex: 99999, isolation: 'isolate' }}>
        <div className="notif-icon-wrapper">
          <div className="notification-trigger" onClick={toggleNotifications}>
            <img 
              src="/notif-icon.svg" 
              alt="Notifications" 
              className="notif-icon"
              style={{ cursor: 'pointer', filter: 'brightness(0) invert(1)' }}
            />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="notification-dropdown" style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '320px',
            backgroundColor: '#1e1e1e',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)',
            zIndex: 999999,
            maxHeight: '400px',
            overflow: 'hidden'
          }}>
            <div className="notification-header">
              <h4>Notifications</h4>
              <span className="notification-count">{notifications.length}</span>
            </div>
            
            <div className="notification-list">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    {!notification.read && <div className="notification-dot"></div>}
                  </div>
                ))
              ) : (
                <div className="no-notifications">
                  <p>No notifications</p>
                </div>
              )}
            </div>
            
            <div className="notification-footer">
              <button className="view-all-btn">View All</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderActions;