import emailjs from '@emailjs/browser';

// EmailJS configuration - you'll need to set these up in your EmailJS account
const EMAILJS_SERVICE_ID = 'service_2nxh02m';
const EMAILJS_TEMPLATE_ID = 'template_4fp5hrj'; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = 'ars7eBQgj4hgM2R5j'; // Replace with your public key

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Send password setup email to newly created doctor
 * @param {Object} doctorData - Doctor information
 * @param {string} doctorData.email - Doctor's email
 * @param {string} doctorData.name - Doctor's name
 * @param {string} doctorData.hospitalName - Hospital name
 * @param {string} setupToken - Unique token for password setup
 * @returns {Promise} EmailJS response
 */
export const sendDoctorInvitationEmail = async (doctorData, setupToken) => {
  try {
    // Get the current origin, but make it more flexible for development
    let baseUrl = `http://${window.location.host}`; // Force http protocol for development
    
    // If we're in development and using localhost, but want to use IP
    // You can override this by setting a custom environment variable
    if (process.env.NODE_ENV === 'development') {
      // Check if there's a custom base URL in localStorage for development
      const customBaseUrl = localStorage.getItem('customBaseUrl');
      if (customBaseUrl) {
        baseUrl = customBaseUrl;
      }
    }
    
    // Create password setup URL
    const setupUrl = `${baseUrl}/setup-password?token=${setupToken}&email=${encodeURIComponent(doctorData.email)}`;
    
    console.log('🔗 Generated setup URL:', setupUrl);
    
    // Template parameters that exactly match your EmailJS template
    const templateParams = {
      full_name: doctorData.name,           // {{full_name}} in your template
      hospital_name: doctorData.hospitalName, // {{hospital_name}} in your template  
      action_link: setupUrl,               // {{action_link}} in your template
      email: doctorData.email              // {{email}} in your template
    };

    console.log('EmailJS Configuration:');
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Template ID:', EMAILJS_TEMPLATE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY.substring(0, 5) + '...');
    console.log('Template Parameters:', templateParams);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error status:', error.status);
    console.error('Error text:', error.text);
    console.error('Error name:', error.name);
    console.error('Full error object:', error);
    
    // Add specific error messages for common issues
    if (error.status === 422) {
      throw new Error('EmailJS Template Error: Check that your template variables match exactly (full_name, hospital_name, action_link, email)');
    } else if (error.status === 401) {
      throw new Error('EmailJS Authentication Error: Check your Service ID, Template ID, and Public Key');
    } else if (error.status === 400) {
      throw new Error('EmailJS Bad Request: Check your template configuration and parameters');
    } else {
      throw error;
    }
  }
};

/**
 * Generate a secure token for password setup
 * @returns {string} Random token
 */
export const generateSetupToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Set custom base URL for email links (useful for development with IP addresses)
 * @param {string} baseUrl - Custom base URL (e.g., 'http://192.168.1.100:3000')
 */
export const setCustomBaseUrl = (baseUrl) => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem('customBaseUrl', baseUrl);
    console.log('🔧 Custom base URL set for email links:', baseUrl);
  } else {
    console.warn('Custom base URL can only be set in development mode');
  }
};

/**
 * Clear custom base URL (revert to window.location.origin)
 */
export const clearCustomBaseUrl = () => {
  localStorage.removeItem('customBaseUrl');
  console.log('🔧 Custom base URL cleared, using default origin');
};

/**
 * Get current base URL being used for email links
 */
export const getCurrentBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    const customBaseUrl = localStorage.getItem('customBaseUrl');
    return customBaseUrl || window.location.origin;
  }
  return window.location.origin;
};
