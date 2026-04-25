// test-brevo-smtp.js
// Usage: node test-brevo-smtp.js
// Make sure to replace the API key and email addresses before running.

const Brevo = require('@getbrevo/brevo');

// Replace with your actual Brevo API key
const API_KEY = 'YOUR_BREVO_API_KEY';

const brevo = new Brevo.TransactionalEmailsApi();
brevo.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, API_KEY);

const sendSmtpEmail = {
  to: [{ email: 'recipient@example.com', name: 'Recipient Name' }], // Change to your test recipient
  sender: { email: 'your@email.com', name: 'Your Name' }, // Change to your sender
  subject: 'Brevo SMTP Test',
  htmlContent: '<h1>Brevo SMTP Test</h1><p>This is a test email sent using the Brevo SMTP API.</p>'
};

brevo.sendTransacEmail(sendSmtpEmail)
  .then(data => {
    console.log('Email sent successfully:', data);
  })
  .catch(error => {
    console.error('Error sending email:', error.response?.body || error);
  });
