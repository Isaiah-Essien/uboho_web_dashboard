import emailjs from '@emailjs/browser';

// EmailJS configuration - you'll need to set these up in your EmailJS account
const EMAILJS_SERVICE_ID = 'service_2nxh02m';
const EMAILJS_PATIENT_TEMPLATE_ID = 'template_patient'; // You'll need to create this template
const EMAILJS_PUBLIC_KEY = 'ars7eBQgj4hgM2R5j';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Send patient account setup email to newly created patient
 * @param {Object} patientData - Patient information
 * @param {string} patientData.email - Patient's email
 * @param {string} patientData.name - Patient's name
 * @param {string} patientData.hospitalName - Hospital name
 * @param {string} setupToken - Unique token for account setup
 * @returns {Promise} EmailJS response
 */
export const sendPatientInvitationEmail = async (patientData, setupToken) => {
  try {
    // Get the current origin, but make it more flexible for development
    let baseUrl = window.location.origin;
    
    // If we're in development and using localhost, but want to use IP
    if (process.env.NODE_ENV === 'development') {
      const customBaseUrl = localStorage.getItem('customBaseUrl');
      if (customBaseUrl) {
        baseUrl = customBaseUrl;
      }
    }
    
    // Create patient account setup URL
    const setupUrl = `${baseUrl}/patient-setup?token=${setupToken}&email=${encodeURIComponent(patientData.email)}`;
    
    console.log('🔗 Generated patient setup URL:', setupUrl);
    
    // Template parameters for patient invitation email
    const templateParams = {
      patient_name: patientData.name,           // {{patient_name}} in your template
      hospital_name: patientData.hospitalName, // {{hospital_name}} in your template  
      action_link: setupUrl,                   // {{action_link}} in your template
      patient_email: patientData.email        // {{patient_email}} in your template
    };

    console.log('EmailJS Configuration for Patient:');
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Patient Template ID:', EMAILJS_PATIENT_TEMPLATE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY.substring(0, 5) + '...');
    console.log('Template Parameters:', templateParams);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_PATIENT_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Patient invitation email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending patient invitation email:', error);
    console.error('Error status:', error.status);
    console.error('Error text:', error.text);
    console.error('Error name:', error.name);
    console.error('Full error object:', error);
    
    // Add specific error messages for common issues
    if (error.status === 422) {
      throw new Error('EmailJS Template Error: Check that your patient template variables match exactly (patient_name, hospital_name, action_link, patient_email)');
    } else if (error.status === 401) {
      throw new Error('EmailJS Authentication Error: Check your Service ID, Patient Template ID, and Public Key');
    } else if (error.status === 400) {
      throw new Error('EmailJS Bad Request: Check your patient template configuration and parameters');
    } else {
      throw error;
    }
  }
};

/**
 * Generate a secure token for patient account setup
 * @returns {string} Random token
 */
export const generatePatientSetupToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
