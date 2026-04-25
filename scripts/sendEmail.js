
import { TransactionalEmailsApi } from '@getbrevo/brevo';

const apiKey = process.env.BREVO_API_KEY;

const apiInstance = new TransactionalEmailsApi();
apiInstance.authentications['apiKey'].apiKey = apiKey;

async function sendTestEmail() {
  const sendSmtpEmail = {
    to: [{ email: 'payalm.lenka@gmail.com', name: 'Recipient Name' }],
    sender: { email: 'sodikmohamedonline@gmail.com', name: 'Payal Lenka' },
    subject: 'Test Email from Brevo',
    htmlContent: '<html><body><h1>Hello from Brevo!</h1><p>This is a test email.</p></body></html>'
  };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendTestEmail();
