import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from services/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Resend } from 'resend';

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('ERROR: RESEND_API_KEY is not defined in services/api/.env');
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const to = 'saquibsarfaraz47@gmail.com';

  console.log(`Sending test email via Resend...`);
  console.log(`From: ${from}`);
  console.log(`To: ${to}`);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: 'Hello World - Kraxyy Apply Resend Integration Test',
      html: '<p>Congrats on sending your <strong>first email</strong> through Kraxyy Apply!</p><p>Your Resend integration is now fully connected and ready for production password resets.</p>'
    });

    if (error) {
      console.error('Resend returned an error:', error);
      process.exit(1);
    }

    console.log('Test email sent successfully! Email ID:', data?.id);
  } catch (err) {
    console.error('Exception sending test email:', err);
    process.exit(1);
  }
}

main();
