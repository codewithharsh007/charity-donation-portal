// utils/sendMail.js
import nodemailer from 'nodemailer';

const sendorgEmail = async (to, subject, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // 🌟 HTML Email Template
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

        // <a href="#" style="display: inline-block; margin-top: 20px; padding: 12px 25px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-size: 16px;">
        //   Verify Now
        // </a>
      </div>

      <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 13px; color: #777;">
        <p>© 2025 Charity Portal. All Rights Reserved.</p>
      </div>

    </div>
  </div>
  `;

  const mailOptions = {
    from: `"Charity Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

export default sendorgEmail;
