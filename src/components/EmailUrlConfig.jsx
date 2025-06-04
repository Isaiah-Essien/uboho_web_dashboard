import React, { useState, useEffect } from 'react';
import { setCustomBaseUrl, clearCustomBaseUrl, getCurrentBaseUrl } from '../utils/emailService';

const EmailUrlConfig = () => {
  const [customUrl, setCustomUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(getCurrentBaseUrl());
  }, []);

  const handleSetCustomUrl = () => {
    if (customUrl.trim()) {
      setCustomBaseUrl(customUrl.trim());
      setCurrentUrl(customUrl.trim());
      setCustomUrl('');
    }
  };

  const handleClearCustomUrl = () => {
    clearCustomBaseUrl();
    setCurrentUrl(`http://${window.location.host}`); // Force HTTP protocol
  };

  const handleUseCurrentIP = () => {
    // Get current host but replace localhost with local IP
    const currentHost = window.location.host;
    const protocol = window.location.protocol;
    
    // If it's localhost, suggest using the most common local IP
    if (currentHost.includes('localhost')) {
      const suggestedUrl = `${protocol}//192.168.1.100:${window.location.port || '3000'}`;
      setCustomUrl(suggestedUrl);
    } else {
      setCustomUrl(window.location.origin);
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1e1e1e',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '15px',
      color: '#fff',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#4caf50' }}>Email URL Config (Dev)</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current URL for emails:</strong>
        <div style={{ 
          background: '#333', 
          padding: '5px', 
          borderRadius: '4px', 
          margin: '5px 0',
          wordBreak: 'break-all'
        }}>
          {currentUrl}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Enter custom base URL"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          style={{
            width: '100%',
            padding: '5px',
            borderRadius: '4px',
            border: '1px solid #555',
            background: '#333',
            color: '#fff',
            fontSize: '11px'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSetCustomUrl}
          disabled={!customUrl.trim()}
          style={{
            padding: '5px 8px',
            borderRadius: '4px',
            border: 'none',
            background: customUrl.trim() ? '#4caf50' : '#666',
            color: '#fff',
            fontSize: '10px',
            cursor: customUrl.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Set URL
        </button>
        
        <button
          onClick={handleUseCurrentIP}
          style={{
            padding: '5px 8px',
            borderRadius: '4px',
            border: 'none',
            background: '#2196f3',
            color: '#fff',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Use IP
        </button>
        
        <button
          onClick={handleClearCustomUrl}
          style={{
            padding: '5px 8px',
            borderRadius: '4px',
            border: 'none',
            background: '#f44336',
            color: '#fff',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default EmailUrlConfig;
