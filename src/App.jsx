import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HospitalProvider } from './contexts/HospitalContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login.jsx';
import ForgotPass from './pages/ForgotPassword.jsx';
import Overview from './pages/Overview.jsx';
import OtpPage from './pages/OtpPage.jsx';
import Patients from './pages/Patients.jsx';
import AddPatient from './pages/AddPatient.jsx'; // ✅ Import AddPatient page
import Messages from './pages/Messages.jsx';
import Admin from './pages/Admin.jsx';
import Settings from './pages/Settings.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import PasswordConfirmation from './pages/PasswordConfirmation.jsx';
import Surveillance from './pages/Surveillance.jsx';
import PatientConfirmation from './pages/PatientConfirmation.jsx';
import PatientData from './pages/PatientData.jsx';
import PatientData2 from './pages/PatientData2.jsx';
import RawData from './pages/RawData.jsx';
import CreateDoctor from './pages/CreateDoctor.jsx';
import DoctorConfirmation from './pages/DoctorConfirmation.jsx';
import SetupPassword from './pages/SetupPassword.jsx';
import PasswordSetupSuccess from './pages/PasswordSetupSuccess.jsx';
// import EmailDebugTest from './components/EmailDebugTest.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpass" element={<ForgotPass />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/overview" element={<PrivateRoute><Overview /></PrivateRoute>} />
          <Route path="/patients" element={<PrivateRoute><Patients /></PrivateRoute>} />
          <Route path="/patients/add" element={<PrivateRoute><AddPatient /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/messages/chat/:userId" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
          <Route path="/password-confirmation" element={<PrivateRoute><PasswordConfirmation /></PrivateRoute>} />
          <Route path="/surveillance" element={<PrivateRoute><Surveillance /></PrivateRoute>} />
          <Route path="/patients/confirmation" element={<PrivateRoute><PatientConfirmation /></PrivateRoute>} />
          <Route path="/patients/:patientId" element={<PrivateRoute><PatientData /></PrivateRoute>} />
          <Route path="/patients/:patientId/data" element={<PrivateRoute><PatientData2 /></PrivateRoute>} />
          <Route path="/rawdata" element={<PrivateRoute><RawData /></PrivateRoute>} />
          <Route path="/admin/create-doctor" element={<PrivateRoute><CreateDoctor /></PrivateRoute>} />
          <Route path="/doctor-confirmation" element={<PrivateRoute><DoctorConfirmation /></PrivateRoute>} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/password-setup-success" element={<PasswordSetupSuccess />} />
          {/* <Route path="/email-debug" element={<EmailDebugTest />} /> */}
        </Routes>
        </Router>
      </HospitalProvider>
    </AuthProvider>
  );
}

export default App;
