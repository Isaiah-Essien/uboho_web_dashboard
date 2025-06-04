/**
 * Utilities for searching across the Uboho Dashboard app
 */

/**
 * Fetch patients for search functionality
 * In a real app, this would typically fetch from an API endpoint
 * @returns {Promise<Array>} Array of patient objects with searchable data
 */
export const fetchSearchPatients = async () => {
  // This is mock data - in a real application, replace with API call
  // Example: return await fetch('/api/patients/search').then(res => res.json());
  
  return [
    { id: 'p001', name: 'John Doe', path: '/patients/p001', icon: '/card7-img.svg', type: 'patient' },
    { id: 'p002', name: 'Sarah Smith', path: '/patients/p002', icon: '/card7-img.svg', type: 'patient' },
    { id: 'p003', name: 'Michael Johnson', path: '/patients/p003', icon: '/card7-img.svg', type: 'patient' },
    { id: 'p004', name: 'Emma Wilson', path: '/patients/p004', icon: '/card7-img.svg', type: 'patient' },
    { id: 'p005', name: 'James Brown', path: '/patients/p005', icon: '/card7-img.svg', type: 'patient' },
    { id: 'p006', name: 'Emily Davis', path: '/patients/p006', icon: '/card7-img.svg', type: 'patient' },
    { id: 'p007', name: 'Robert Miller', path: '/patients/p007', icon: '/card7-img.svg', type: 'patient' },
    { id: 'p008', name: 'Jennifer Taylor', path: '/patients/p008', icon: '/card7-img.svg', type: 'patient' },
  ];
};

/**
 * Get a list of all searchable pages in the application
 * @returns {Array} Array of page objects with path and metadata
 */
export const getSearchablePages = () => {
  return [
    { id: 'overview', title: 'Overview', path: '/overview', icon: '/Overv-on.svg', type: 'page' },
    { id: 'patients', title: 'Patients', path: '/patients', icon: '/Patients-off.svg', type: 'page' },
    { id: 'add-patient', title: 'Add Patient', path: '/patients/add', icon: '/add-icon.svg', type: 'page' },
    { id: 'messages', title: 'Messages', path: '/messages', icon: '/Mess-off.svg', type: 'page' },
    { id: 'admin', title: 'Admin Dashboard', path: '/admin', icon: '/admin-on.svg', type: 'page' },
    { id: 'settings', title: 'Settings', path: '/settings', icon: '/sett-on.svg', type: 'page' },
    { id: 'surveillance', title: 'Surveillance', path: '/surveillance', icon: '/Surv-off.svg', type: 'page' },
    { id: 'raw-data', title: 'Raw Data', path: '/rawdata', icon: '/boxes.svg', type: 'page' },
    { id: 'change-password', title: 'Change Password', path: '/change-password', icon: '/passw-icon.svg', type: 'page' },
  ];
};

/**
 * Process search query against all searchable content
 * @param {string} query - The search term
 * @returns {Promise<Array>} Matching results
 */
export const performGlobalSearch = async (query) => {
  if (!query || query.trim().length === 0) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Get pages
  const pages = getSearchablePages();
  
  // Get patients (in a real app, this would be an API call)
  const patients = await fetchSearchPatients();
  
  // Filter pages
  const matchingPages = pages.filter(page => 
    page.title.toLowerCase().includes(normalizedQuery)
  );
  
  // Filter patients
  const matchingPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(normalizedQuery)
  );
  
  // Combine and return results, limiting to a reasonable number
  return [...matchingPages, ...matchingPatients].slice(0, 10);
};
