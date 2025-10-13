import { NextResponse } from 'next/server';
import sendorgEmail from '@/utils/emailService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Send email to site admin / support
    const adminEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_TO || 'support@example.com';

    const emailSubject = subject || `Contact Form Message from ${name}`;
    const emailBody = `
      <h3>New contact message</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <div>${message.replace(/\n/g, '<br/>')}</div>
    `;

    try {
      if (sendorgEmail) {
        await sendorgEmail(adminEmail, emailSubject, emailBody);
      }
    } catch (err) {
      console.error('Contact email send failed:', err);
      // continue to return success to the user; alternatively you could return 500
    }

    return NextResponse.json({ message: 'Message received. We will get back to you soon.' }, { status: 200 });
  } catch (err) {
    console.error('Contact API error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
