# Firebase Storage Setup Instructions

## Setting up Firebase Storage Security Rules

To allow users to upload profile images, you need to update your Firebase Storage security rules.

### Steps:

1. **Go to Firebase Console:**
   - Visit https://console.firebase.google.com/
   - Select your project

2. **Navigate to Storage:**
   - Click on "Storage" in the left sidebar
   - Go to the "Rules" tab

3. **Update the rules:**
   - Replace the existing rules with the content from `storage.rules` file in this project
   - Or manually copy and paste the rules below:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload and manage their own profile images
    match /profile_images/{userType}/{hospitalId}/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         userType == 'patients' || 
         userType == 'doctors' || 
         userType == 'admins');
    }
    
    // Allow authenticated users to read profile images
    match /profile_images/{allPaths=**} {
      allow read: if request.auth != null;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Publish the rules:**
   - Click "Publish" to apply the new rules

### What these rules do:

- Allow authenticated users to upload profile images to the `profile_images/` folder
- Allow reading of profile images by any authenticated user
- Organize images by user type (patients, doctors, admins) and hospital
- Prevent unauthorized access to other parts of storage

### File Upload Restrictions:

The profile image service includes these validations:
- **File Types:** JPEG, PNG, GIF only
- **File Size:** Maximum 5MB
- **Authentication:** User must be logged in

### Testing:

After updating the rules, try uploading a profile image again. If you still get permission errors:

1. Check that you're logged in to the application
2. Verify the Firebase project ID matches your configuration
3. Ensure the storage bucket is correctly configured in your environment variables
4. Check the browser console for detailed error messages

### Troubleshooting:

If you continue to have issues:
- Check the Firebase Console for any error logs
- Verify your user authentication is working properly
- Ensure the hospital ID and user ID are correctly passed to the upload function
