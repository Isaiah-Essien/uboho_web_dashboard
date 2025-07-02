# Environment Setup Guide

This project uses environment variables to securely store sensitive information like API keys and configuration data.

## Quick Setup

1. **Copy the example environment file:**

   ```bash
   copy .env.example .env
   ```

2. **Update the `.env` file with your actual values:**
   - Get EmailJS credentials from [EmailJS.com](https://www.emailjs.com/)
   - Get Firebase credentials from your [Firebase Console](https://console.firebase.google.com/)

## Required Environment Variables

### EmailJS Configuration

- `VITE_EMAILJS_SERVICE_ID` - Your EmailJS service ID
- `VITE_EMAILJS_TEMPLATE_ID` - Template ID for doctor invitation emails
- `VITE_EMAILJS_PATIENT_WELCOME_TEMPLATE_ID` - Template ID for patient welcome emails
- `VITE_EMAILJS_PUBLIC_KEY` - Your EmailJS public key

### Firebase Configuration

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

## Security Notes

- **Never commit the `.env` file to version control**
- The `.env` file is already listed in `.gitignore`
- Always use the `.env.example` file to document required variables
- In production, set environment variables through your hosting platform
- For Vite projects, environment variables must be prefixed with `VITE_`

## Getting Your Credentials

### EmailJS Setup

1. Sign up at [EmailJS.com](https://www.emailjs.com/)
2. Create an email service
3. Create email templates for doctor invitations and patient welcome emails
4. Get your service ID, template IDs, and public key

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings > General
4. Scroll down to "Your apps" and select the web app
5. Copy the config object values to your `.env` file

## Troubleshooting

If you see errors about missing environment variables:

1. Make sure your `.env` file exists in the project root
2. Verify all required variables are set in `.env`
3. Restart your development server after adding/modifying environment variables
4. Check that variable names start with `VITE_` prefix
