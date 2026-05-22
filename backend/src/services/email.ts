import nodemailer from 'nodemailer';

// Validate environment variables early
const validateEmailConfig = () => {
  const required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing email configuration: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

/**
 * Configure Nodemailer transport.
 */
const createTransporter = () => {
  if (!validateEmailConfig()) {
    console.warn('⚠️ Email service started with incomplete configuration');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
    requireTLS: true,
    tls: {
      rejectUnauthorized: false
    }
  } as any);
};

const transporter = createTransporter();

/**
 * Generates a premium, responsive, and bilingual HTML template for system emails.
 * Uses community heritage colors: Rosewood (#8B1D3D), Gold (#D4AF37), and Ivory (#FDFBF4).
 */
const generatePremiumTemplate = (content: { en: string; ta: string }, actionBox?: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <title>Mohanur Kongu Matrimony</title>
      <style>
        body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #FDFBF4; }
        .container { max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #D4AF37; border-radius: 8px; overflow: hidden; }
        .header { background-color: #8B1D3D; padding: 30px; text-align: center; border-bottom: 4px solid #D4AF37; }
        .logo { font-size: 24px; color: #D4AF37; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 40px 30px; color: #3A2F2F; line-height: 1.6; }
        .section { margin-bottom: 30px; }
        .tamil-text { font-family: 'Arial', sans-serif; color: #8B1D3D; font-weight: 500; font-size: 18px; margin-bottom: 8px; }
        .english-text { font-size: 16px; margin-bottom: 20px; }
        .action-box { text-align: center; margin: 30px 0; background-color: #FDFBF4; padding: 25px; border-radius: 6px; border: 1px dashed #D4AF37; }
        .footer { background-color: #F5F1E6; padding: 20px; text-align: center; font-size: 12px; color: #7A4A3B; border-top: 1px solid #D4AF37; }
        @media screen and (max-width: 600px) {
          .container { width: 100% !important; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FDFBF4; padding: 20px 0;">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <div class="logo">Mohanur Kongu Matrimony</div>
              </div>
              <div class="content">
                <div class="section">
                  <div class="tamil-text">${content.ta}</div>
                  <div class="english-text">${content.en}</div>
                </div>
                ${actionBox || ''}
              </div>
              <div class="footer">
                <p>&copy; 2026 Mohanur Kongu Matrimony. All rights reserved.</p>
                <p>Bringing lineages together through heritage.</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Sends a One-Time Password (OTP) to the specified email address for Signup.
 * 
 * NOTE: We await the email delivery to ensure Vercel/Serverless functions
 * don't terminate before the mail is sent.
 */
export const sendOTP = async (email: string, otp: string): Promise<void> => {
  const html = generatePremiumTemplate({
    ta: "வணக்கம்! உங்கள் கணக்கை உருவாக்க தயவுசெய்து இந்த குறியீட்டைப் பயன்படுத்தவும்.",
    en: "Welcome! To complete your registration, please use the following verification code."
  }, `
    <div class="action-box">
      <div style="font-size: 12px; color: #8B1D3D; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Verification Code</div>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8B1D3D;">${otp}</div>
      <div style="margin-top: 20px; font-size: 13px; color: #7A4A3B;">
        <div style="font-weight: bold; color: #8B1D3D;">இந்த குறியீடு 5 நிமிடங்கள் மட்டுமே செல்லுபடியாகும்.</div>
        <div>This code is valid for 5 minutes only.</div>
      </div>
    </div>
  `);

  const mailOptions = {
    from: `"Mohanur Kongu Matrimony" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Verification Code`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[OTP Email] Successfully sent to ${email}`);
  } catch (error: any) {
    console.error(`[OTP Email] Failed to send to ${email}:`, error.message);
    throw error;
  }
};

/**
 * Sends a Welcome email after successful account verification.
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const html = generatePremiumTemplate({
    ta: `வாழ்த்துக்கள் ${name}! மோகனூர் கொங்கு திருமண தகவல் மையத்தில் உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது.`,
    en: `Congratulations ${name}! Your account has been successfully created on Mohanur Kongu Matrimony.`
  }, `
    <div style="text-align: center; margin: 30px 0;">
      <p style="color: #7A4A3B;">Your journey to find the perfect match within our community begins here.</p>
      <div style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/login" style="background-color: #8B1D3D; color: #D4AF37; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; border: 1px solid #D4AF37;">Login to your Account</a>
      </div>
    </div>
  `);

  const mailOptions = {
    from: `"Mohanur Kongu Matrimony" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Mohanur Kongu Matrimony',
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Welcome Email] Successfully sent to ${email}`);
  } catch (error: any) {
    console.error(`[Welcome Email] Failed to send to ${email}:`, error.message);
    throw error;
  }
};

/**
 * Sends an OTP for Password Reset.
 */
export const sendResetPasswordOTP = async (email: string, otp: string): Promise<void> => {
  const html = generatePremiumTemplate({
    ta: "கடவுச்சொல்லை மாற்ற கோரிக்கை விடுத்துள்ளீர்கள். தயவுசெய்து இந்த குறியீட்டைப் பயன்படுத்தவும்.",
    en: "You have requested to reset your password. Please use the following verification code."
  }, `
    <div class="action-box">
      <div style="font-size: 12px; color: #8B1D3D; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Password Reset Code</div>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8B1D3D;">${otp}</div>
      <div style="margin-top: 20px; font-size: 13px; color: #7A4A3B;">
        <div style="font-weight: bold; color: #8B1D3D;">இந்த குறியீடு 5 நிமிடங்கள் மட்டுமே செல்லுபடியாகும்.</div>
        <div>This code is valid for 5 minutes only.</div>
      </div>
    </div>
  `);

  const mailOptions = {
    from: `"Mohanur Kongu Matrimony" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Password Reset Code`,
    html,
  };

  try {
    console.log(`[Reset Password Email] Attempting to send to: ${email}`);
    await transporter.sendMail(mailOptions);
    console.log(`[Reset Password Email] Successfully sent to ${email}`);
  } catch (error: any) {
    console.error(`[Reset Password Email] Failed to send to ${email}:`, error.message);
    throw error;
  }
};

/**
 * Generic email sender for future use.
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: `"Mohanur Kongu Matrimony" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending generic email:', error);
    throw error;
  }
};
