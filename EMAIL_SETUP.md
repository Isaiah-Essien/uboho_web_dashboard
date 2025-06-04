# EmailJS Setup Instructions

This document provides instructions for setting up EmailJS to send doctor invitation emails.

## 1. Create an EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## 2. Create an Email Service

1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID** (e.g., `service_abc123`)

## 3. Create an Email Template

1. Go to "Email Templates" in your dashboard
2. Click "Create New Template"
3. Use this template content:

### Template Subject:

```
Welcome to {{hospital_name}} - Set Up Your Account
```

### Template Body (HTML):

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: #2563eb;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .content {
        background: #f9fafb;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .button {
        display: inline-block;
        background: #2563eb;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #666;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to {{hospital_name}}</h1>
      </div>
      <div class="content">
        <h2>Hello Dr. {{to_name}},</h2>
        <p>
          You have been added as a doctor at <strong>{{hospital_name}}</strong>.
          To complete your account setup, please click the button below to
          create your password.
        </p>

        <p style="text-align: center;">
          <a href="{{setup_url}}" class="button">Set Up Your Password</a>
        </p>

        <p>
          <strong>Important:</strong> This link will expire in 7 days for
          security reasons. If you need a new invitation, please contact your
          hospital administrator.
        </p>

        <h3>What happens next?</h3>
        <ul>
          <li>Click the setup link above</li>
          <li>Create a secure password for your account</li>
          <li>Log in using your email ({{to_email}}) and new password</li>
          <li>Access the hospital management dashboard</li>
        </ul>

        <p>
          If you have any questions, please contact your hospital administrator.
        </p>

        <p>
          Best regards,<br />
          {{from_name}}
        </p>
      </div>
      <div class="footer">
        <p>This email was sent from the Uboho Hospital Management System</p>
      </div>
    </div>
  </body>
</html>
```

4. Save the template and note down your **Template ID** (e.g., `template_xyz789`)

## 4. Get Your Public Key

1. Go to "Account" in your EmailJS dashboard
2. Find your **Public Key** (e.g., `user_abcdefghijk`)

## 5. Update Your Application

Update the following file with your EmailJS credentials:

**File: `src/utils/emailService.js`**

```javascript
// Replace these with your actual EmailJS credentials
const EMAILJS_SERVICE_ID = "your_actual_service_id"; // From step 2
const EMAILJS_TEMPLATE_ID = "your_actual_template_id"; // From step 3
const EMAILJS_PUBLIC_KEY = "your_actual_public_key"; // From step 4
```

## 6. Template Variables

The email template uses these variables that are automatically populated:

- `{{to_name}}` - Doctor's full name
- `{{to_email}}` - Doctor's email address
- `{{hospital_name}}` - Name of the hospital
- `{{setup_url}}` - Unique URL for password setup
- `{{from_name}}` - Sender name (Uboho Hospital Management System)

## 7. Testing

1. Create a test doctor using the admin panel
2. Check if the email is sent successfully
3. Verify the setup link works correctly
4. Test the password creation process

## 8. Troubleshooting

### Common Issues:

1. **Email not sending**

   - Check your EmailJS service configuration
   - Verify your credentials are correct
   - Check browser console for errors

2. **Email going to spam**

   - Set up SPF/DKIM records for your domain
   - Use a verified email service
   - Test with different email providers

3. **Setup link not working**
   - Check if the URL is correctly formatted
   - Verify the token generation is working
   - Check browser console for Firebase errors

### EmailJS Limits:

- Free plan: 200 emails/month
- Rate limit: 50 emails/hour
- For production, consider upgrading to a paid plan

## 9. Security Considerations

- Setup tokens expire after use
- Links are unique per doctor
- Passwords must be at least 6 characters
- Failed attempts are logged
- Tokens are removed after successful password setup

## 10. Alternative Email Services

If you prefer other email services, you can replace EmailJS with:

- **SendGrid** - More robust for production
- **Mailgun** - Good API and deliverability
- **Amazon SES** - Cost-effective for high volume
- **Nodemailer** - If you have a backend server

For production applications, consider using a backend service with proper email templates and delivery tracking.
