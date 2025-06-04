import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, collection, addDoc, updateDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

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
            where('authUid', '==', currentUser.uid),
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

  // Add a new doctor to the current hospital
  const addDoctor = async (doctorData, setupToken) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    try {
      // Add doctor to the hospital's doctors subcollection
      const doctorRef = await addDoc(
        collection(db, 'hospitals', currentHospital.id, 'doctors'),
        {
          name: doctorData.name,
          email: doctorData.email,
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

  // Add a new patient to the current hospital
  const addPatient = async (patientData, setupToken = null) => {
    if (!currentHospital) {
      throw new Error('No hospital associated with your account');
    }

    try {
      // Add patient to the hospital's patients subcollection
      const patientRef = await addDoc(
        collection(db, 'hospitals', currentHospital.id, 'patients'),
        {
          // Personal Information
          name: patientData.name,
          email: patientData.email,
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
          
          // Emergency Contact
          emergencyContact: {
            name: patientData.emergencyContactName,
            relation: patientData.emergencyContactRelation,
            email: patientData.emergencyContactEmail,
            phone: patientData.emergencyContactPhone,
            countryCode: patientData.emergencyContactCountryCode
          },
          
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

      return patientRef.id;
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

  const value = {
    currentHospital,
    addDoctor,
    getDoctors,
    updateDoctor,
    addPatient,
    getPatients,
    updatePatient,
    loading
  };

  return (
    <HospitalContext.Provider value={value}>
      {!loading && children}
    </HospitalContext.Provider>
  );
}