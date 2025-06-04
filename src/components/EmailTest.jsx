import React, { useState } from 'react';
import { sendDoctorInvitationEmail, generateSetupToken } from '../utils/emailService';

const EmailTest = () => {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testName, setTestName] = useState('Dr. Test Doctor');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleTestEmail = async () => {
    setLoading(true);
    setResult('');

    try {
      const setupToken = generateSetupToken();
      
      await sendDoctorInvitationEmail({
        name: testName,
        email: testEmail,
        hospitalName: 'Test Hospital'
      }, setupToken);

      setResult('✅ Test email sent successfully! Check your inbox.');
    } catch (error) {
      setResult(`❌ Failed to send email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Email Service Test</h2>
      <p>Use this component to test your EmailJS configuration before using it in production.</p>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Test Email:</label>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          placeholder="Enter your email to test"
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Test Doctor Name:</label>
        <input
          type="text"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          placeholder="Enter doctor name for test"
        />
      </div>

      <button
        onClick={handleTestEmail}
        disabled={loading || !testEmail}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {loading ? 'Sending Test Email...' : 'Send Test Email'}
      </button>

      {result && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: result.startsWith('✅') ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${result.startsWith('✅') ? '#10b981' : '#ef4444'}`,
          borderRadius: '4px',
          color: result.startsWith('✅') ? '#065f46' : '#991b1b'
        }}>
          {result}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Setup Instructions:</h3>
        <ol>
          <li>Update EmailJS credentials in <code>src/utils/emailService.js</code></li>
          <li>Follow the setup guide in <code>EMAIL_SETUP.md</code></li>
          <li>Enter your email above and click "Send Test Email"</li>
          <li>Check your inbox for the invitation email</li>
          <li>Test the setup password link</li>
        </ol>
      </div>
    </div>
  );
};

export default EmailTest;
