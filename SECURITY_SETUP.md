# Security Setup Guide

## Overview

This guide explains how to properly secure sensitive information in the Uboho Dashboard application using environment variables and Git ignore patterns.

## Environment Variables Setup

### 1. Create Environment File

Copy the `.env.example` file to create your local environment file:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Windows Command Prompt
copy .env.example .env
```

### 2. Configure Required Variables

Edit the `.env` file with your actual values:

#### EmailJS Configuration

1. Sign up/login to [EmailJS](https://www.emailjs.com/)
2. Create a service and get your Service ID
3. Create email templates and get Template IDs
4. Get your Public Key from Account settings

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PATIENT_WELCOME_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

#### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Copy the configuration values

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## Security Best Practices

### Files Protected by .gitignore

The following sensitive files are automatically ignored by Git:

- `.env` - Contains your actual API keys and secrets
- `.env.local` - Local environment overrides
- `.env.production` - Production environment variables
- `firebase-debug.log` - Firebase debug logs
- `*.log` - All log files

### Files Safe to Commit

- `.env.example` - Template file with placeholder values
- `.gitignore` - Git ignore rules
- Source code files using `import.meta.env.VITE_*` variables

## Verification Steps

### 1. Check Git Status

Ensure sensitive files are ignored:

```bash
git status
```

Your `.env` file should NOT appear in the list of changes.

### 2. Test Environment Loading

The application will show console errors if environment variables are missing:

```javascript
// Check browser console for this message
"Missing required EmailJS environment variables. Please check your .env file.";
```

### 3. Verify API Connections

- EmailJS: Test by adding a new doctor (should send invitation email)
- Firebase: Test by logging in (should connect to Firestore)

## Troubleshooting

### Environment Variables Not Loading

1. Ensure variable names start with `VITE_`
2. Restart the development server after changing `.env`
3. Check for syntax errors in `.env` (no spaces around =)

### Git Still Tracking .env

If `.env` was previously committed:

```bash
# Remove from Git tracking (keeps local file)
git rm --cached .env

# Commit the removal
git commit -m "Remove .env from tracking"
```

### Production Deployment

For production environments:

1. **Never** commit `.env` files
2. Set environment variables in your hosting platform:
   - Vercel: Project Settings > Environment Variables
   - Netlify: Site Settings > Environment Variables
   - AWS/Azure: Use their respective environment configuration

## Team Setup Instructions

### For New Team Members

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Ask team lead for actual API keys and values
4. Fill in the `.env` file with provided values
5. Run `npm install` and `npm run dev`

### For Team Leads

1. Share API keys securely (never via Git, email, or chat)
2. Use secure sharing tools like:
   - 1Password shared vaults
   - Azure Key Vault
   - AWS Secrets Manager
   - Encrypted communication tools

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] All hardcoded API keys removed from source code
- [ ] Environment variables use `VITE_` prefix
- [ ] `.env.example` created with placeholder values
- [ ] Team members know not to commit sensitive data
- [ ] Production uses proper environment variable management

## Additional Security Measures

### API Key Rotation

- Regularly rotate API keys (quarterly recommended)
- Update `.env` files across all environments
- Monitor for any leaked keys in Git history

### Access Control

- Limit Firebase project access to necessary team members
- Use Firebase security rules for database access
- Implement proper user authentication and authorization

### Monitoring

- Monitor Firebase usage for unusual activity
- Set up EmailJS usage alerts
- Regular security audits of codebase

## Support

If you encounter issues with environment setup:

1. Check this guide first
2. Verify all required variables are set
3. Contact the development team lead
4. Check application logs for specific error messages

Remember: **Never commit actual API keys or secrets to version control!**
