import React, { useState } from 'react';
import { sendDoctorInvitationEmail, generateSetupToken } from '../utils/emailService';

const EmailDebugTest = () => {
  const [testResults, setTestResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    name: 'Dr. Test Doctor',
    email: 'test@example.com',
    hospitalName: 'Test Hospital'
  });

  const testEmailJS = async () => {
    setLoading(true);
    setTestResults('Testing EmailJS configuration...\n\n');

    try {
      // Generate a test token
      const token = generateSetupToken();
      setTestResults(prev => prev + `✅ Token generated: ${token}\n\n`);

      // Test the email service
      setTestResults(prev => prev + '📧 Attempting to send email...\n');
      
      const response = await sendDoctorInvitationEmail(testData, token);
      
      setTestResults(prev => prev + `✅ Email sent successfully!\n`);
      setTestResults(prev => prev + `Response: ${JSON.stringify(response, null, 2)}\n`);
      
    } catch (error) {
      setTestResults(prev => prev + `❌ Email failed!\n`);
      setTestResults(prev => prev + `Error type: ${error.constructor.name}\n`);
      setTestResults(prev => prev + `Error message: ${error.message || 'No message'}\n`);
      setTestResults(prev => prev + `Error status: ${error.status || 'No status'}\n`);
      setTestResults(prev => prev + `Error text: ${error.text || 'No text'}\n`);
      setTestResults(prev => prev + `Full error: ${JSON.stringify(error, null, 2)}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testTemplateParams = () => {
    const token = generateSetupToken();
    const setupUrl = `${window.location.origin}/setup-password?token=${token}&email=${encodeURIComponent(testData.email)}`;
    
    const templateParams = {
      full_name: testData.name,
      hospital_name: testData.hospitalName,
      action_link: setupUrl,
      email: testData.email
    };

    setTestResults(`Template Parameters that will be sent:\n\n${JSON.stringify(templateParams, null, 2)}\n\nSetup URL: ${setupUrl}`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h2>EmailJS Debug Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Data:</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Doctor Name:</label>
          <input
            type="text"
            value={testData.name}
            onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
            style={{ width: '100%', padding: '5px', margin: '5px 0' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={testData.email}
            onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
            style={{ width: '100%', padding: '5px', margin: '5px 0' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Hospital:</label>
          <input
            type="text"
            value={testData.hospitalName}
            onChange={(e) => setTestData(prev => ({ ...prev, hospitalName: e.target.value }))}
            style={{ width: '100%', padding: '5px', margin: '5px 0' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testTemplateParams}
          style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Preview Template Parameters
        </button>
        <button 
          onClick={testEmailJS}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#059669', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Send Email'}
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px', 
        border: '1px solid #dee2e6',
        whiteSpace: 'pre-wrap',
        minHeight: '200px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {testResults || 'Click "Preview Template Parameters" to see what will be sent to EmailJS, or "Test Send Email" to actually send a test email.'}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>EmailJS Configuration Check:</h3>
        <ul>
          <li>Service ID: service_2nxh02m</li>
          <li>Template ID: template_4fp5hrj</li>
          <li>Public Key: ars7eBQgj4hgM2R5j</li>
          <li>Template Variables: full_name, hospital_name, action_link, email</li>
        </ul>
        
        <h3>Common 422 Error Causes:</h3>
        <ul>
          <li>Template variables don't match your EmailJS template</li>
          <li>Missing required fields in template</li>
          <li>Invalid service ID, template ID, or public key</li>
          <li>EmailJS service not properly configured</li>
          <li>Email provider authentication issues</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailDebugTest;
