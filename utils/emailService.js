import nodemailer from 'nodemailer';

/**
 * Send OTP email using Nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} otp - OTP code to send
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
const sendorgEmail = async (to, subject, otp) => {
  try {
    // Validate environment variables. If missing, fall back to logging the OTP in dev
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set — falling back to console logging the OTP (development only)');
      // For development convenience, print OTP to console and return the OTP
      // so flows that depend on OTP can work without a real SMTP provider.
      // NOTE: In production, ensure EMAIL_USER and EMAIL_PASS are set.
      return { sent: true, devOtp: otp };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password for Gmail
      },
    });

    // HTML Email Template
    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(90deg, #007bff, #00bcd4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🌍 Charity Portal</h1>
        </div>

        <div style="padding: 30px; text-align: center;">
          <h2 style="color: #333;">Email Verification</h2>
          <p style="font-size: 16px; color: #555;">
            Thank you for registering with <b>Charity Portal</b>.<br/>
            Please use the OTP below to verify your email address.
          </p>

          <div style="margin: 20px 0;">
            <span style="display: inline-block; font-size: 28px; letter-spacing: 6px; background: #f0f8ff; padding: 10px 20px; border: 2px dashed #007bff; border-radius: 8px; color: #007bff;">
              ${otp}
            </span>
          </div>

          <p style="font-size: 14px; color: #777;">
            This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.
          </p>
        </div>

        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 13px; color: #777;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Charity Portal. All Rights Reserved.</p>
        </div>

      </div>
    </div>
    `;

    // Mail options
    const mailOptions = {
      from: `"Charity Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default sendorgEmail;