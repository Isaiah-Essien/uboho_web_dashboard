// src/components/HeaderActions.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { performGlobalSearch } from '../utils/searchUtils';
import { useNotifications } from '../contexts/NotificationContext';
import './styles/HeaderActions.css';

const HeaderActions = ({ onSearch }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const searchTimeout = useRef(null);
  const navigate = useNavigate();

  // Handle search input with debounce
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (query.trim()) {
      setIsSearching(true);
      setShowSearchResults(true);
      
      // Set a timeout to avoid searching on every keystroke
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await performGlobalSearch(query);
          setSearchResults(results);
          setActiveResultIndex(-1);
          setIsSearching(false);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSearchResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveResultIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeResultIndex >= 0 && searchResults[activeResultIndex]) {
          navigateToResult(searchResults[activeResultIndex]);
        }
        break;
      case 'Escape':
        setShowSearchResults(false);
        setSearchQuery('');
        break;
    }
  };

  // Navigate to search result
  const navigateToResult = (result) => {
    console.log('Navigate to:', result.path);
    if (result.path) {
      navigate(result.path);
    }
    setShowSearchResults(false);
    setSearchQuery('');
    setActiveResultIndex(-1);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Call parent component's search function if provided
      if (onSearch) {
        onSearch(searchQuery);
      }
      // If there are results and no active selection, navigate to first result
      if (searchResults.length > 0 && activeResultIndex === -1) {
        navigateToResult(searchResults[0]);
      } else if (activeResultIndex >= 0) {
        navigateToResult(searchResults[activeResultIndex]);
      }
    }
  };

  // Toggle notification dropdown
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // If it's a message notification, navigate directly to the conversation
    if (notification.type === 'message' && notification.senderId) {
      navigate(`/messages/chat/${notification.senderId}`);
      setShowNotifications(false);
    } else if (notification.type === 'message') {
      // Fallback to messages page
      navigate('/messages');
      setShowNotifications(false);
    }
  };

  // Handle view all notifications
  const handleViewAll = () => {
    navigate('/messages'); // For now, redirect to messages
    setShowNotifications(false);
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

  return (
    <div className="header-actions">
      {/* Search Bar with Results Dropdown */}
      <div className="searchbar-container" ref={searchRef}>
        <div className="searchbar">
          <input
            type="text"
            placeholder="Search anything in Uboho..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
          />
          <img 
            src="/Search-icon.svg" 
            alt="Search" 
            className="search-icon"
            onClick={handleSearchSubmit}
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery.trim() && (
          <div className="search-results-dropdown">
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
                      <p className="search-result-title">{result.title || result.name}</p>
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
      <div className="notif-icon-wrapper" ref={notificationRef}>
        <div className="notification-trigger" onClick={toggleNotifications}>
          <img 
            src="/notif-icon.svg" 
            alt="Notifications" 
            className="notif-icon"
            style={{ cursor: 'pointer' }}
          />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="notification-dropdown">
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
                    onClick={() => handleNotificationClick(notification)}
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
              <button className="view-all-btn" onClick={handleViewAll}>View All</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderActions;