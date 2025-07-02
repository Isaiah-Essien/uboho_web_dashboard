import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { sendPatientWelcomeEmail } from '../utils/emailService';

const HospitalContext = createContext();

export function useHospital() {
  return useContext(HospitalContext);
}

export function HospitalProvider({ children }) {
  const [currentHospital, setCurrentHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Get current user's hospital information (admin or doctor)
  useEffect(() => {
    const fetchUserHospital = async () => {
      if (!currentUser) {
        setCurrentHospital(null);
        setLoading(false);
        return;
      }

      try {
        // First, check if user is an admin of a hospital
        const hospitalQuery = query(
          collection(db, 'hospitals'),
          where('adminId', '==', currentUser.uid)
        );
        
        const hospitalSnapshot = await getDocs(hospitalQuery);
        
        if (!hospitalSnapshot.empty) {
          const hospitalDoc = hospitalSnapshot.docs[0];
          setCurrentHospital({
            id: hospitalDoc.id,
            ...hospitalDoc.data(),
            userRole: 'admin'
          });
          return;
        }

        // If not admin, check if user is a doctor in any hospital
        const allHospitalsQuery = query(collection(db, 'hospitals'));
        const allHospitalsSnapshot = await getDocs(allHospitalsQuery);
        
        for (const hospitalDoc of allHospitalsSnapshot.docs) {
          const doctorsQuery = query(
            collection(db, 'hospitals', hospitalDoc.id, 'doctors'),
            where('authId', '==', currentUser.uid),
            where('status', '==', 'active')
          );
          
          const doctorsSnapshot = await getDocs(doctorsQuery);
          
          if (!doctorsSnapshot.empty) {
            setCurrentHospital({
              id: hospitalDoc.id,
              ...hospitalDoc.data(),
              userRole: 'doctor'
            });
            return;
          }
        }
        
        console.log('No hospital found for current user');
        setCurrentHospital(null);
      } catch (error) {
        console.error('Error fetching user hospital:', error);
        setCurrentHospital(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserHospital();
  }, [currentUser]);

  // Email validation helper functions
  const checkDoctorEmailExists = async (email) => {
    if (!currentHospital) {
      return false;
    }

    try {
      const doctorsQuery = query(
        collection(db, 'hospitals', currentHospital.id, 'doctors'),
        where('email', '==', email.toLowerCase())
      );
      const snapshot = await getDocs(doctorsQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking doctor email:', error);
      return false;
    }
  };

  const checkPatientEmailExists = async (email) => {
    if (!currentHospital) {
      return false;
    }

    try {
      const patientsQuery = query(
        collection(db, 'hospitals', currentHospital.id, 'patients'),
        where('email', '==', email.toLowerCase())
      );
      const snapshot = await getDocs(patientsQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking patient email:', error);
      return false;
    }
  };

  // Add a new doctor to the current hospital
  const addDoctor = async (doctorData, setupToken) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    // Check if email already exists
    const emailExists = await checkDoctorEmailExists(doctorData.email);
    if (emailExists) {
      throw new Error('A doctor with this email address already exists in your hospital');
    }

    try {
      // Add doctor to the hospital's doctors subcollection
      const doctorRef = await addDoc(
        collection(db, 'hospitals', currentHospital.id, 'doctors'),
        {
          name: doctorData.name,
          email: doctorData.email.toLowerCase(), // Store email in lowercase for consistency
          specialization: doctorData.specialization || '',
          hospitalId: currentHospital.id,
          hospitalName: currentHospital.name,
          setupToken: setupToken,
          passwordSet: false,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          status: 'pending'
        }
      );

      return doctorRef.id;
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error;
    }
  };

  // Get all doctors from the current hospital
  const getDoctors = async () => {
    if (!currentHospital) {
      return [];
    }

    try {
      const doctorsSnapshot = await getDocs(
        collection(db, 'hospitals', currentHospital.id, 'doctors')
      );
      
      return doctorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  };

  // Update doctor information
  const updateDoctor = async (doctorId, updateData) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    try {
      await updateDoc(
        doc(db, 'hospitals', currentHospital.id, 'doctors', doctorId),
        {
          ...updateData,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        }
      );
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  };

  // Delete doctor from the current hospital
  const deleteDoctor = async (doctorId) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    try {
      await deleteDoc(
        doc(db, 'hospitals', currentHospital.id, 'doctors', doctorId)
      );
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  };

  // Add a new patient to the current hospital
  const addPatient = async (patientData, setupToken = null) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    // Check if email already exists
    const emailExists = await checkPatientEmailExists(patientData.email);
    if (emailExists) {
      throw new Error('A patient with this email address already exists in your hospital');
    }

    try {
      // Add patient to the hospital's patients subcollection
      const patientRef = await addDoc(
        collection(db, 'hospitals', currentHospital.id, 'patients'),
        {
          // Personal Information
          name: patientData.name,
          email: patientData.email.toLowerCase(), // Store email in lowercase for consistency
          phone: patientData.phone,
          countryCode: patientData.countryCode,
          dateOfBirth: patientData.dateOfBirth,
          
          // Medical Information
          height: patientData.height,
          weight: patientData.weight,
          medicalConditions: patientData.medicalConditions,
          allergies: patientData.allergies,
          dietaryPreferences: patientData.dietaryPreferences,
          bloodSugarLevel: patientData.bloodSugarLevel,
          
          // Address Information
          address: {
            country: patientData.country,
            state: patientData.state,
            city: patientData.city,
            houseAddress: patientData.houseAddress,
            zipCode: patientData.zipCode
          },
          
          // Emergency Contacts (array to support multiple contacts)
          emergencyContacts: [
            {
              name: patientData.emergencyContactName,
              relation: patientData.emergencyContactRelation,
              email: patientData.emergencyContactEmail,
              phone: patientData.emergencyContactPhone,
              countryCode: patientData.emergencyContactCountryCode,
              isPrimary: true, // First contact is primary
              createdBy: currentUser.uid
            }
          ].filter(contact => contact.name && contact.name.trim() !== ''), // Only add if name is provided
          
          // Account setup information (if setup token provided)
          ...(setupToken && {
            setupToken: setupToken,
            accountCreated: false,
            passwordSet: false
          }),
          
          // Metadata
          hospitalId: currentHospital.id,
          hospitalName: currentHospital.name,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          status: 'active'
        }
      );

      const patientId = patientRef.id;

      // Send welcome email to the patient
      try {
        await sendPatientWelcomeEmail({
          name: patientData.name,
          email: patientData.email,
          hospitalName: currentHospital.name
        }, patientId);
        
        console.log('✅ Welcome email sent successfully to patient:', patientData.email);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email to patient:', emailError);
        // Don't throw error - patient creation should succeed even if email fails
      }

      return patientId;
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  };

  // Get all patients from the current hospital
  const getPatients = async () => {
    if (!currentHospital) {
      return [];
    }

    try {
      const patientsSnapshot = await getDocs(
        collection(db, 'hospitals', currentHospital.id, 'patients')
      );
      
      return patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  };

  // Real-time subscription to patients (for components that need live updates)
  const subscribeToPatients = (callback) => {
    if (!currentHospital) {
      callback([]);
      return () => {};
    }

    const unsubscribe = onSnapshot(
      collection(db, 'hospitals', currentHospital.id, 'patients'),
      (snapshot) => {
        const patients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(patients);
      },
      (error) => {
        console.error('Error in patients subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  };

  // Update patient information
  const updatePatient = async (patientId, updateData) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    try {
      await updateDoc(
        doc(db, 'hospitals', currentHospital.id, 'patients', patientId),
        {
          ...updateData,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        }
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  };

  // Emergency Contact Management Functions (for mobile app)
  const addEmergencyContact = async (patientId, newContact) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    try {
      // Get current patient data
      const patientDoc = await getDoc(
        doc(db, 'hospitals', currentHospital.id, 'patients', patientId)
      );

      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }

      const currentPatient = patientDoc.data();
      const currentContacts = currentPatient.emergencyContacts || [];

      // Add new contact with metadata
      const contactToAdd = {
        ...newContact,
        isPrimary: currentContacts.length === 0, // First contact is primary
        createdAt: serverTimestamp(),
        createdBy: patientId // Assuming patient is adding from mobile app
      };

      const updatedContacts = [...currentContacts, contactToAdd];

      await updateDoc(
        doc(db, 'hospitals', currentHospital.id, 'patients', patientId),
        {
          emergencyContacts: updatedContacts,
          updatedAt: serverTimestamp(),
          updatedBy: patientId
        }
      );

      return contactToAdd;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  };

  const updateEmergencyContact = async (patientId, contactIndex, updatedContact) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    try {
      // Get current patient data
      const patientDoc = await getDoc(
        doc(db, 'hospitals', currentHospital.id, 'patients', patientId)
      );

      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }

      const currentPatient = patientDoc.data();
      const currentContacts = currentPatient.emergencyContacts || [];

      if (contactIndex < 0 || contactIndex >= currentContacts.length) {
        throw new Error('Invalid contact index');
      }

      // Update the specific contact
      const updatedContacts = [...currentContacts];
      updatedContacts[contactIndex] = {
        ...updatedContacts[contactIndex],
        ...updatedContact,
        updatedAt: serverTimestamp(),
        updatedBy: patientId
      };

      await updateDoc(
        doc(db, 'hospitals', currentHospital.id, 'patients', patientId),
        {
          emergencyContacts: updatedContacts,
          updatedAt: serverTimestamp(),
          updatedBy: patientId
        }
      );

      return updatedContacts[contactIndex];
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  };

  const removeEmergencyContact = async (patientId, contactIndex) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    try {
      // Get current patient data
      const patientDoc = await getDoc(
        doc(db, 'hospitals', currentHospital.id, 'patients', patientId)
      );

      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }

      const currentPatient = patientDoc.data();
      const currentContacts = currentPatient.emergencyContacts || [];

      if (contactIndex < 0 || contactIndex >= currentContacts.length) {
        throw new Error('Invalid contact index');
      }

      // Don't allow removing the last contact
      if (currentContacts.length === 1) {
        throw new Error('Cannot remove the last emergency contact');
      }

      const updatedContacts = currentContacts.filter((_, index) => index !== contactIndex);

      // If we removed the primary contact, make the first remaining contact primary
      if (currentContacts[contactIndex].isPrimary && updatedContacts.length > 0) {
        updatedContacts[0].isPrimary = true;
      }

      await updateDoc(
        doc(db, 'hospitals', currentHospital.id, 'patients', patientId),
        {
          emergencyContacts: updatedContacts,
          updatedAt: serverTimestamp(),
          updatedBy: patientId
        }
      );
    } catch (error) {
      console.error('Error removing emergency contact:', error);
      throw error;
    }
  };

  // Get current sensor data for all patients
  const getAllPatientsSensorData = async () => {
    if (!currentHospital) {
      return [];
    }

    try {
      const patients = await getPatients();
      const sensorDataPromises = patients.map(patient => {
        const sensorDocRef = doc(db, 'hospitals', currentHospital.id, 'patients', patient.id, 'sensors', 'current');
        return getDoc(sensorDocRef).then(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            return {
              patientId: patient.id,
              patientName: patient.name,
              timestamp: data.timestamp,
              x_accel: data.x_accel,
              y_accel: data.y_accel,
              z_accel: data.z_accel,
              x_gyro: data.x_gyro,
              y_gyro: data.y_gyro,
              z_gyro: data.z_gyro,
            };
          }
          return null;
        });
      });

      const sensorData = await Promise.all(sensorDataPromises);
      return sensorData.filter(data => data !== null);
    } catch (error) {
      console.error('Error fetching sensor data for all patients:', error);
      throw error;
    }
  };

  // Get current sensor data for a single patient
  const getPatientSensorData = async (patientId) => {
    if (!currentHospital || !patientId) {
      return null;
    }

    try {
      const sensorDocRef = doc(db, 'hospitals', currentHospital.id, 'patients', patientId, 'sensors', 'current');
      const docSnap = await getDoc(sensorDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          patientId: patientId,
          timestamp: data.timestamp,
          x_accel: data.x_accel,
          y_accel: data.y_accel,
          z_accel: data.z_accel,
          x_gyro: data.x_gyro,
          y_gyro: data.y_gyro,
          z_gyro: data.z_gyro,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching sensor data for patient:', error);
      throw error;
    }
  };

  // Get a single patient's data
  const getPatient = async (patientId) => {
    if (!currentHospital || !patientId) {
      return null;
    }

    try {
      const patientDoc = await getDoc(
        doc(db, 'hospitals', currentHospital.id, 'patients', patientId)
      );
      
      if (patientDoc.exists()) {
        return {
          id: patientDoc.id,
          ...patientDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  };

  // Get the most recent seizure event for all patients
  const getAllPatientsSeizureEvents = async () => {
    if (!currentHospital) {
      return [];
    }

    try {
      const patients = await getPatients();
      const seizureEventPromises = patients.map(async (patient) => {
        try {
          // Get the most recent seizure event for this patient
          const seizureEventsRef = collection(db, 'hospitals', currentHospital.id, 'patients', patient.id, 'seizure_events');
          const seizureEventsQuery = query(seizureEventsRef, orderBy('timestamp', 'desc'), limit(1));
          const seizureEventsSnapshot = await getDocs(seizureEventsQuery);
          
          console.log(`Seizure events for ${patient.name}:`, seizureEventsSnapshot.size, 'documents found');
          
          let seizureEventData = null;
          if (!seizureEventsSnapshot.empty) {
            const doc = seizureEventsSnapshot.docs[0];
            seizureEventData = {
              id: doc.id,
              ...doc.data()
            };
            console.log(`Latest seizure event for ${patient.name}:`, seizureEventData);
          }

          return {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            emergencyContacts: patient.emergencyContacts || [],
            lastSeizureEvent: seizureEventData
          };
        } catch (error) {
          console.error(`Error fetching seizure events for patient ${patient.id}:`, error);
          return {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            emergencyContacts: patient.emergencyContacts || [],
            lastSeizureEvent: null
          };
        }
      });

      const patientsWithSeizureEvents = await Promise.all(seizureEventPromises);
      return patientsWithSeizureEvents;
    } catch (error) {
      console.error('Error fetching patients seizure events:', error);
      throw error;
    }
  };

  // Get all seizure events for a specific patient
  const getPatientSeizureEvents = async (patientId) => {
    if (!currentHospital) {
      return [];
    }

    try {
      const seizureEventsRef = collection(db, 'hospitals', currentHospital.id, 'patients', patientId, 'seizure_events');
      const seizureEventsQuery = query(seizureEventsRef, orderBy('timestamp', 'desc'));
      const seizureEventsSnapshot = await getDocs(seizureEventsQuery);
      
      const seizureEvents = [];
      seizureEventsSnapshot.forEach((doc) => {
        seizureEvents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`All seizure events for patient ${patientId}:`, seizureEvents.length, 'events found');
      return seizureEvents;
    } catch (error) {
      console.error(`Error fetching seizure events for patient ${patientId}:`, error);
      return [];
    }
  };

  const value = {
    currentHospital,
    addDoctor,
    getDoctors,
    updateDoctor,
    deleteDoctor,
    addPatient,
    getPatients,
    subscribeToPatients,
    updatePatient,
    checkDoctorEmailExists,
    checkPatientEmailExists,
    addEmergencyContact,
    updateEmergencyContact,
    removeEmergencyContact,
    getAllPatientsSensorData,
    getPatientSensorData,
    getPatient,
    getAllPatientsSeizureEvents,
    getPatientSeizureEvents,
  };

  return (
    <HospitalContext.Provider value={value}>
      {!loading && children}
    </HospitalContext.Provider>
  );
}