// ...existing code...
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// try loading environment file for development (checks .env.local then local.env)
const loadLocalEnv = () => {
  try {
    const root = process.cwd();
    const envLocalPath = path.join(root, '.env.local');
    const localEnvPath = path.join(root, 'local.env');

    if (fs.existsSync(envLocalPath)) {
      dotenv.config({ path: envLocalPath });
    } else if (fs.existsSync(localEnvPath)) {
      dotenv.config({ path: localEnvPath });
    }
  } catch (err) {
    // ignore loading errors; we'll surface helpful error below if vars missing
    console.error('Failed to load local env file:', err.message);
  }
};

loadLocalEnv();

/**
 * Send OTP email using Nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} otp - OTP code to send
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
const sendorgEmail = async (to, subject, otp) => {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error(
        'Email configuration missing. Set EMAIL_USER and EMAIL_PASS in environment or create .env.local / local.env at project root.'
      );
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
    await transporter.sendMail(mailOptions);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default sendorgEmail;
// ...existing code...