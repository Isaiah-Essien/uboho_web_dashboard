# Updated EmailJS Template Suggestion

To make the mobile app link clickable in your EmailJS template, update your template content to:

```
Welcome to the Uboho family, {{patient_name}}! We're excited to have you on board.

You've been invited by your hospital, {{hospital_name}}, and your account has been successfully created.

Your patient ID is {{patient_id}}.

You're now ready to explore all the great services we offer.

[Open Uboho]({{mobile_app_link}})

If you have any questions or need help getting started, our support team is just an email away at {{email}}. We're here to assist you every step of the way!

Best regards,
The Uboho Team
```

## Alternative HTML Version

If you want a more stylized button, you can use HTML in your EmailJS template:

```html
<p>
  Welcome to the Uboho family, {{patient_name}}! We're excited to have you on
  board.
</p>

<p>
  You've been invited by your hospital, {{hospital_name}}, and your account has
  been successfully created.
</p>

<p>Your patient ID is <strong>{{patient_id}}</strong>.</p>

<p>You're now ready to explore all the great services we offer.</p>

<p style="text-align: center; margin: 20px 0;">
  <a
    href="{{mobile_app_link}}"
    style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;"
  >
    📱 Open Uboho App
  </a>
</p>

<p>
  If you have any questions or need help getting started, our support team is
  just an email away at {{email}}. We're here to assist you every step of the
  way!
</p>

<p>
  Best regards,<br />
  The Uboho Team
</p>
```

## Current Mobile App Link

The system currently sends this dummy link: `https://play.google.com/store/apps/details?id=com.uboho.app`

You can update this in `src/utils/emailService.js` when you have the actual app store links.
