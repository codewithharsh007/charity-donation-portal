import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

function loadLocalEnv() {
  try {
    let dotenv = null;
    try {
      /* eslint-disable no-eval */
      const req = eval('require');
      dotenv = req && req('dotenv');
      /* eslint-enable no-eval */
    } catch (e) {
      console.warn('dotenv not available; skipping local .env load');
      return;
    }

    const candidates = ['.env.local', 'local.env', '.env'];
    for (const fname of candidates) {
      const p = path.resolve(process.cwd(), fname);
      if (fs.existsSync(p)) {
        const res = dotenv.config({ path: p });
        if (res.error) {
          console.warn('Failed to parse env file', p, res.error.message || res.error);
        } else {
          
        }
        return;
      }
    }
  } catch (err) {
    console.warn('Failed to load local env file:', err && err.message ? err.message : err);
  }
}

loadLocalEnv();

/**
 * Create email transporter
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send subscription cancellation email to NGO
 * @param {string} to - NGO email address
 * @param {Object} data - Cancellation data
 * @param {string} data.ngoName - Name of the NGO
 * @param {string} data.planName - Name of the subscription plan
 * @param {string} data.reason - Reason for cancellation
 * @param {Date} data.cancelledAt - Cancellation date
 */
export const sendCancellationEmail = async (to, data) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return { sent: false, devMode: true };
    }

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(90deg, #ef4444, #dc2626); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🔔 Subscription Cancelled</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 10px;">Hello ${data.ngoName},</h2>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            We regret to inform you that your <b>${data.planName}</b> subscription has been cancelled by the administrator.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 14px;">Cancellation Reason:</h3>
            <p style="color: #7f1d1d; margin: 0; font-size: 14px;">${data.reason}</p>
          </div>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #374151;"><strong>Cancelled On:</strong> ${new Date(data.cancelledAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Status:</strong> <span style="color: #ef4444;">Cancelled</span></p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            If you believe this was done in error or would like to discuss this further, please contact our support team.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ngo/dashboard/subscription" 
               style="display: inline-block; background: linear-gradient(90deg, #ef4444, #dc2626); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Subscription Status
            </a>
          </div>
        </div>

        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 13px; color: #777;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Charity Portal. All Rights Reserved.</p>
          <p style="margin: 5px 0 0 0;">Need help? Contact us at support@charityportal.com</p>
        </div>

      </div>
    </div>
    `;

    const mailOptions = {
      from: `"Charity Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Subscription Cancelled - Charity Portal',
      html,
    };

    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
    return { sent: false, error: error.message };
  }
};

/**
 * Send tier change email to NGO
 * @param {string} to - NGO email address
 * @param {Object} data - Tier change data
 * @param {string} data.ngoName - Name of the NGO
 * @param {string} data.oldTier - Previous tier name
 * @param {string} data.newTier - New tier name
 * @param {string} data.reason - Reason for change
 * @param {Date} data.changedAt - Change date
 * @param {boolean} data.isUpgrade - Whether it's an upgrade
 */
export const sendTierChangeEmail = async (to, data) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return { sent: false, devMode: true };
    }

    const changeType = data.isUpgrade ? 'Upgraded' : 'Changed';
    const color = data.isUpgrade ? '#10b981' : '#3b82f6';

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(90deg, ${color}, ${color}dd); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">${data.isUpgrade ? '🎉' : '🔄'} Subscription ${changeType}</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 10px;">Hello ${data.ngoName},</h2>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Your subscription tier has been ${changeType.toLowerCase()} by the administrator.
          </p>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px; color: white;">
              <div>
                <p style="margin: 0; font-size: 12px; opacity: 0.9;">Previous Tier</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${data.oldTier}</p>
              </div>
              <div style="font-size: 24px;">→</div>
              <div>
                <p style="margin: 0; font-size: 12px; opacity: 0.9;">New Tier</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${data.newTier}</p>
              </div>
            </div>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px;">Reason for Change:</h3>
            <p style="color: #1e3a8a; margin: 0; font-size: 14px;">${data.reason}</p>
          </div>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #374151;"><strong>Changed On:</strong> ${new Date(data.changedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Status:</strong> <span style="color: #10b981;">Active</span></p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your new tier features are now active. Visit your dashboard to explore the updated capabilities.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ngo/dashboard/subscription" 
               style="display: inline-block; background: linear-gradient(90deg, ${color}, ${color}dd); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Subscription Details
            </a>
          </div>
        </div>

        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 13px; color: #777;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Charity Portal. All Rights Reserved.</p>
          <p style="margin: 5px 0 0 0;">Need help? Contact us at support@charityportal.com</p>
        </div>

      </div>
    </div>
    `;

    const mailOptions = {
      from: `"Charity Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Subscription ${changeType} - Charity Portal`,
      html,
    };

    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send tier change email:', error);
    return { sent: false, error: error.message };
  }
};

/**
 * Send refund notification email to NGO
 * @param {string} to - NGO email address
 * @param {Object} data - Refund data
 * @param {string} data.ngoName - Name of the NGO
 * @param {number} data.amount - Refund amount
 * @param {string} data.reason - Reason for refund
 * @param {string} data.refundId - Refund ID
 * @param {Date} data.refundedAt - Refund date
 */
export const sendRefundEmail = async (to, data) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return { sent: false, devMode: true };
    }

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(90deg, #10b981, #059669); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">💰 Refund Processed</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 10px;">Hello ${data.ngoName},</h2>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            A refund has been processed for your subscription payment.
          </p>

          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Refund Amount</p>
            <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold;">₹${data.amount.toLocaleString('en-IN')}</p>
          </div>

          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 14px;">Refund Reason:</h3>
            <p style="color: #047857; margin: 0; font-size: 14px;">${data.reason}</p>
          </div>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #374151;"><strong>Refund ID:</strong> ${data.refundId}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Processed On:</strong> ${new Date(data.refundedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Status:</strong> <span style="color: #10b981;">Completed</span></p>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              <strong>⏱️ Processing Time:</strong> The refund will be credited to your original payment method within 5-7 business days.
            </p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            If you have any questions about this refund, please don't hesitate to contact our support team.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ngo/dashboard/subscription" 
               style="display: inline-block; background: linear-gradient(90deg, #10b981, #059669); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Transaction History
            </a>
          </div>
        </div>

        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 13px; color: #777;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Charity Portal. All Rights Reserved.</p>
          <p style="margin: 5px 0 0 0;">Need help? Contact us at support@charityportal.com</p>
        </div>

      </div>
    </div>
    `;

    const mailOptions = {
      from: `"Charity Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Refund Processed - Charity Portal',
      html,
    };

    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send refund email:', error);
    return { sent: false, error: error.message };
  }
};

/**
 * Send subscription expiry reminder email to NGO
 * @param {string} to - NGO email address
 * @param {Object} data - Expiry data
 * @param {string} data.ngoName - Name of the NGO
 * @param {string} data.planName - Name of the subscription plan
 * @param {Date} data.expiryDate - Expiry date
 * @param {number} data.daysLeft - Days remaining
 */
export const sendExpiryReminderEmail = async (to, data) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return { sent: false, devMode: true };
    }

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(90deg, #f59e0b, #d97706); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Subscription Expiring Soon</h1>
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 10px;">Hello ${data.ngoName},</h2>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            This is a friendly reminder that your <b>${data.planName}</b> subscription is expiring soon.
          </p>

          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Days Remaining</p>
            <p style="margin: 10px 0 0 0; font-size: 48px; font-weight: bold;">${data.daysLeft}</p>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 14px;">Expiry Details:</h3>
            <p style="color: #78350f; margin: 0; font-size: 14px;">
              <strong>Expiry Date:</strong> ${new Date(data.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Don't lose access to:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
              <li style="margin: 5px 0;">Premium features and tools</li>
              <li style="margin: 5px 0;">Priority support</li>
              <li style="margin: 5px 0;">Enhanced visibility</li>
              <li style="margin: 5px 0;">Advanced analytics</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Renew your subscription now to continue enjoying uninterrupted access to all premium features.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription" 
               style="display: inline-block; background: linear-gradient(90deg, #f59e0b, #d97706); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Renew Subscription
            </a>
          </div>
        </div>

        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 13px; color: #777;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Charity Portal. All Rights Reserved.</p>
          <p style="margin: 5px 0 0 0;">Need help? Contact us at support@charityportal.com</p>
        </div>

      </div>
    </div>
    `;

    const mailOptions = {
      from: `"Charity Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⏰ Your ${data.planName} subscription expires in ${data.daysLeft} days`,
      html,
    };

    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send expiry reminder email:', error);
    return { sent: false, error: error.message };
  }
};
