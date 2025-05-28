import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailNotification(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  try {
    await resend.emails.send({
      from: 'Grid <norman@diaogai.io>',
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
} 