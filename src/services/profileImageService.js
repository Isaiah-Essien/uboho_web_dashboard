import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db, auth } from '../firebase/config';

/**
 * Upload a profile image to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @param {string} userType - Either 'patients', 'doctors', or 'admins'
 * @param {string} hospitalId - The hospital ID
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export const uploadProfileImage = async (file, userId, userType, hospitalId) => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to upload images');
    }
    
    // Debug: Log authentication details
    console.log('Upload debug info:', {
      requestedUserId: userId,
      authenticatedUserId: auth.currentUser.uid,
      userType,
      hospitalId,
      userMatches: auth.currentUser.uid === userId
    });
    
    // Check if the authenticated user matches the requested userId
    if (auth.currentUser.uid !== userId) {
      console.warn('User ID mismatch! User can only upload their own profile image.');
      console.log('Authenticated user:', auth.currentUser.uid);
      console.log('Requested user:', userId);
      // For now, use the authenticated user's ID to match the security rule
      userId = auth.currentUser.uid;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, or GIF images only.');
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload images smaller than 5MB.');
    }
    
    console.log('Uploading image for:', { userId, userType, hospitalId });
    console.log('Using authenticated user ID:', auth.currentUser.uid);
    
    // Create a reference to the storage location - must match the security rule path
    // Always use the authenticated user's ID to ensure security rule compliance
    const actualUserId = auth.currentUser.uid;
    const imageRef = ref(storage, `profile_images/${actualUserId}`);
    
    // Upload the file
    const snapshot = await uploadBytes(imageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Image uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to upload files. Please contact your administrator.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('An unknown error occurred. Please try again.');
    } else {
      throw new Error(error.message || 'Failed to upload profile image');
    }
  }
};

/**
 * Update user's profile image URL in Firestore
 * @param {string} userId - The user's ID
 * @param {string} userType - Either 'patients', 'doctors', or 'admins'
 * @param {string} hospitalId - The hospital ID
 * @param {string} imageUrl - The new image URL
 */
export const updateUserProfileImage = async (userId, userType, hospitalId, imageUrl) => {
  try {
    // Use the authenticated user's ID for the database update as well
    const actualUserId = auth.currentUser ? auth.currentUser.uid : userId;
    
    console.log('Updating profile image in database for:', {
      originalUserId: userId,
      actualUserId,
      userType,
      hospitalId
    });
    
    let docRef;
    
    if (userType === 'admins') {
      // Admins are stored in the root users collection
      docRef = doc(db, 'users', actualUserId);
    } else {
      // Patients and doctors are stored in hospital subcollections
      docRef = doc(db, 'hospitals', hospitalId, userType, actualUserId);
    }
    
    await updateDoc(docRef, {
      profileImage: imageUrl,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile image:', error);
    throw new Error('Failed to update profile image in database');
  }
};

/**
 * Delete a profile image from Firebase Storage
 * @param {string} userId - The user's ID
 * @param {string} userType - Either 'patients', 'doctors', or 'admins'
 * @param {string} hospitalId - The hospital ID
 */
export const deleteProfileImage = async (userId, userType, hospitalId) => {
  try {
    // Always use the authenticated user's ID to ensure security rule compliance
    const actualUserId = auth.currentUser ? auth.currentUser.uid : userId;
    const imageRef = ref(storage, `profile_images/${actualUserId}`);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting profile image:', error);
    // Don't throw error if file doesn't exist
    if (error.code !== 'storage/object-not-found') {
      throw new Error('Failed to delete profile image');
    }
  }
};

/**
 * Get profile image URL for a user
 * @param {string} userId - The user's ID
 * @param {string} userType - Either 'patients', 'doctors', or 'admins'
 * @param {string} hospitalId - The hospital ID
 * @returns {Promise<string|null>} - The download URL or null if no image exists
 */
export const getProfileImageUrl = async (userId, userType, hospitalId) => {
  try {
    // Use the provided userId, but for current user operations, use auth.currentUser.uid
    const actualUserId = auth.currentUser && auth.currentUser.uid === userId ? auth.currentUser.uid : userId;
    const imageRef = ref(storage, `profile_images/${actualUserId}`);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return null; // No image found
    }
    console.error('Error getting profile image URL:', error);
    throw new Error('Failed to get profile image');
  }
};

/**
 * Upload and update profile image in one operation
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @param {string} userType - Either 'patients', 'doctors', or 'admins'
 * @param {string} hospitalId - The hospital ID
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export const uploadAndUpdateProfileImage = async (file, userId, userType, hospitalId) => {
  try {
    // Upload the image
    const imageUrl = await uploadProfileImage(file, userId, userType, hospitalId);
    
    // Update the user's profile in Firestore
    await updateUserProfileImage(userId, userType, hospitalId, imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('Error uploading and updating profile image:', error);
    throw error;
  }
};
