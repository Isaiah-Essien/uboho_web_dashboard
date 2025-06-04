import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import CustomAuthImage from '../components/CustomAuthImageNew';
import '../App.css';
import '../FogP.css';

const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctorData, setDoctorData] = useState(null);
  const [validToken, setValidToken] = useState(false);
  
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setError('Invalid setup link. Please contact your administrator.');
        return;
      }

      try {
        // Search for doctor with matching token and email across all hospitals
        const hospitalsQuery = query(collection(db, 'hospitals'));
        const hospitalsSnapshot = await getDocs(hospitalsQuery);
        
        let foundDoctor = null;
        let hospitalId = null;

        for (const hospitalDoc of hospitalsSnapshot.docs) {
          const doctorsQuery = query(
            collection(db, 'hospitals', hospitalDoc.id, 'doctors'),
            where('setupToken', '==', token),
            where('email', '==', email),
            where('passwordSet', '==', false)
          );
          
          const doctorsSnapshot = await getDocs(doctorsQuery);
          
          if (!doctorsSnapshot.empty) {
            foundDoctor = { id: doctorsSnapshot.docs[0].id, ...doctorsSnapshot.docs[0].data() };
            hospitalId = hospitalDoc.id;
            break;
          }
        }

        if (foundDoctor) {
          setDoctorData({ ...foundDoctor, hospitalId });
          setValidToken(true);
        } else {
          setError('Invalid or expired setup link. Please contact your administrator.');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setError('Error validating setup link. Please try again.');
      }
    };

    validateToken();
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validToken || !doctorData) {
      setError('Invalid setup session. Please try again.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create Firebase Auth account for the doctor
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: doctorData.name
      });

      // Update doctor document to mark password as set and remove setup token
      await updateDoc(
        doc(db, 'hospitals', doctorData.hospitalId, 'doctors', doctorData.id),
        {
          passwordSet: true,
          setupToken: null,
          authUid: user.uid,
          status: 'active',
          passwordSetAt: new Date()
        }
      );

      // Navigate to success page
      navigate('/password-setup-success', {
        state: {
          doctorName: doctorData.name,
          hospitalName: doctorData.hospitalName
        }
      });

    } catch (error) {
      console.error('Error setting up password:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please contact your administrator.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Error setting up your account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!validToken && !error) {
    return (
      <div className="fgp-page">
        <CustomAuthImage imageUrl="/styledimg.svg" />
        <div className="form-panel">
          <div className="form-container">
            <h2>Validating Setup Link...</h2>
            <p>Please wait while we validate your invitation.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !validToken) {
    return (
      <div className="fgp-page">
        <CustomAuthImage imageUrl="/styledimg.svg" />
        <div className="form-panel">
          <div className="form-container">
            <h2>Setup Link Invalid</h2>
            <p className="error-message">{error}</p>
            <button 
              className="btn"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fgp-page">
      <CustomAuthImage imageUrl="/styledimg.svg" />
      
      <div className="form-panel">
        <div className="form-container">
          <h2>Set Up Your Password</h2>
          <p className="subheading">
            Welcome to {doctorData?.hospitalName}, Dr. {doctorData?.name}! 
            Please create a secure password for your account.
          </p>

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="password"
                className="email-input"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <label className="floating-label">New Password</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                className="email-input"
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <label className="floating-label">Confirm Password</label>
            </div>

            <button 
              type="submit" 
              className="btn"
              disabled={loading}
            >
              {loading ? 'Setting Up Account...' : 'Set Password & Activate Account'}
            </button>
          </form>

          <div className="carousel-dashes">
            <span className="dash active"></span>
            <span className="dash"></span>
            <span className="dash"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;
