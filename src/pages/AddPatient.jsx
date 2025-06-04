import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '../contexts/HospitalContext';
import Sidebar from '../components/Sidebar';
import HeaderActions from '../components/HeaderActions';
import '../overview.css';
import '../AddPatient.css';

const AddPatient = () => {
  const navigate = useNavigate();
  const { currentHospital, addPatient } = useHospital();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    countryCode: '+250',
    dateOfBirth: '',
    
    // Medical Information
    height: '',
    weight: '',
    medicalConditions: '',
    allergies: '',
    dietaryPreferences: '',
    bloodSugarLevel: '',
    
    // Address Information
    country: '',
    state: '',
    city: '',
    houseAddress: '',
    zipCode: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactEmail: '',
    emergencyContactPhone: '',
    emergencyContactCountryCode: '+250'
  });

  const handleInputChange = (e, step) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!currentHospital) {
      setError('No hospital associated with your account. Please contact support.');
      return;
    }

    if (!formData.name || !formData.email) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Add patient to database
      const patientId = await addPatient(formData);
      
      // Navigate to confirmation page with success data
      navigate('/patients/confirmation', {
        state: {
          success: true,
          patientData: {
            ...formData,
            id: patientId,
            hospitalName: currentHospital.name
          }
        }
      });
    } catch (error) {
      console.error('Error creating patient:', error);
      setError('Failed to create patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    <div className="form-step" key="step1">
      <h2 className="form-title">Add Patient</h2>
      <p className="form-description">Enter patient information to create a new record.</p>
      <input 
        type="text" 
        name="name"
        placeholder="Full Name" 
        className="form-input" 
        value={formData.name}
        onChange={handleInputChange}
      />
      <input 
        type="email" 
        name="email"
        placeholder="Email Address" 
        className="form-input" 
        value={formData.email}
        onChange={handleInputChange}
      />
      <div className="phone-wrapper">
        <select 
          name="countryCode"
          className="country-code"
          value={formData.countryCode}
          onChange={handleInputChange}
        >
          <option value="+250">+250</option>
          <option value="+1">+1</option>
          <option value="+44">+44</option>
        </select>
        <div className="divider" />
        <input 
          type="tel" 
          name="phone"
          placeholder="Phone Number" 
          className="phone-number" 
          value={formData.phone}
          onChange={handleInputChange}
        />
      </div>
      <input 
        type="date" 
        name="dateOfBirth"
        className="form-input" 
        placeholder="Date of Birth" 
        value={formData.dateOfBirth}
        onChange={handleInputChange}
      />
    </div>,

    <div className="form-step" key="step2">
      <h2 className="form-title">Medical Information</h2>
      <p className="form-description">Provide the patient's medical details.</p>
      <input 
        type="number" 
        name="height"
        placeholder="Height (cm)" 
        className="form-input" 
        value={formData.height}
        onChange={handleInputChange}
      />
      <input 
        type="number" 
        name="weight"
        placeholder="Weight (kg)" 
        className="form-input" 
        value={formData.weight}
        onChange={handleInputChange}
      />
      <input 
        type="text" 
        name="medicalConditions"
        placeholder="Specific Medical Conditions (if any)" 
        className="form-input" 
        value={formData.medicalConditions}
        onChange={handleInputChange}
      />
      <input 
        type="text" 
        name="allergies"
        placeholder="Allergies" 
        className="form-input" 
        value={formData.allergies}
        onChange={handleInputChange}
      />
      <input 
        type="text" 
        name="dietaryPreferences"
        placeholder="Dietary Preferences" 
        className="form-input" 
        value={formData.dietaryPreferences}
        onChange={handleInputChange}
      />
      <input 
        type="number" 
        name="bloodSugarLevel"
        step="0.1" 
        placeholder="Blood Sugar Level (mg/dL)" 
        className="form-input" 
        value={formData.bloodSugarLevel}
        onChange={handleInputChange}
      />
    </div>,

    <div className="form-step" key="step3">
      <h2 className="form-title">Address Information</h2>
      <p className="form-description">Please enter the patient's address details.</p>
      <input 
        type="text" 
        name="country"
        placeholder="Country" 
        className="form-input" 
        value={formData.country}
        onChange={handleInputChange}
      />
      <input 
        type="text" 
        name="state"
        placeholder="State/Province" 
        className="form-input" 
        value={formData.state}
        onChange={handleInputChange}
      />
      <input 
        type="text" 
        name="city"
        placeholder="City" 
        className="form-input" 
        value={formData.city}
        onChange={handleInputChange}
      />
      <input 
        type="text" 
        name="houseAddress"
        placeholder="House Address" 
        className="form-input" 
        value={formData.houseAddress}
        onChange={handleInputChange}
      />
      <input 
        type="text" 
        name="zipCode"
        placeholder="Zip/Postal Code" 
        className="form-input" 
        value={formData.zipCode}
        onChange={handleInputChange}
      />
    </div>,

    <div className="form-step" key="step4">
      <h2 className="form-title">Emergency Contact</h2>
      <p className="form-description">Provide emergency contact details.</p>
      <input 
        type="text" 
        name="emergencyContactName"
        placeholder="Full Name" 
        className="form-input" 
        value={formData.emergencyContactName}
        onChange={handleInputChange}
      />
      <input 
        type="text" 
        name="emergencyContactRelation"
        placeholder="Relation to Patient" 
        className="form-input" 
        value={formData.emergencyContactRelation}
        onChange={handleInputChange}
      />
      <input 
        type="email" 
        name="emergencyContactEmail"
        placeholder="Email Address" 
        className="form-input" 
        value={formData.emergencyContactEmail}
        onChange={handleInputChange}
      />
      <div className="phone-wrapper">
        <select 
          name="emergencyContactCountryCode"
          className="country-code"
          value={formData.emergencyContactCountryCode}
          onChange={handleInputChange}
        >
          <option value="+250">+250</option>
          <option value="+1">+1</option>
          <option value="+44">+44</option>
        </select>
        <div className="divider" />
        <input 
          type="tel" 
          name="emergencyContactPhone"
          placeholder="Phone Number" 
          className="phone-number" 
          value={formData.emergencyContactPhone}
          onChange={handleInputChange}
        />
      </div>
    </div>
  ];

const nextStep = () => {
  if (currentStep < steps.length - 1) {
    setCurrentStep(currentStep + 1);
  } else {
    handleSubmit();
  }
};

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/patients');
    }
  };

  return (
    <div className="overview-container">
      <Sidebar />
      <div className="overview-content">
        <div className="overview-header">
          <div className="header-left row-center">
            <button className="back-btn-round" onClick={prevStep}>
              <img src="/chevleft-icon.svg" alt="Back" />
            </button>
            <h1 className="overview-title">Add Patient</h1>
          </div>
          <HeaderActions />
        </div>

        <div className="form-outer-wrapper">
          <div className="form-wrapper-centered">
            <div className="progress-dashes">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`progress-dash ${idx <= currentStep ? 'active' : ''}`}
                />
              ))}
            </div>

            <div className="form-content">
              {error && (
                <div className="error-message" style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
              
              {steps[currentStep]}
              <div className="form-navigation full-row">
                <button className="back-btn-text" onClick={prevStep} disabled={loading}>
                  <img src="/arrow-left.svg" alt="Back" className="arrow-icon" />
                  Back
                </button>

                <button 
                  className="next-btn" 
                  onClick={nextStep}
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Creating...' : (currentStep === steps.length - 1 ? 'Submit' : 'Next')}
                  <img src="/arrow-right.svg" alt="Next" className="arrow-right" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddPatient;
