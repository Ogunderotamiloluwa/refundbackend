// Email Service using Brevo API
require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'ogunderotamiloluwa@gmail.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Personal Assistant';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('📧 EMAIL SERVICE (BREVO) INITIALIZATION');
console.log('═══════════════════════════════════════════════════════════');
console.log('🔹 Environment: NODE_ENV=', process.env.NODE_ENV);
console.log('🔹 Brevo API Key loaded:', BREVO_API_KEY ? `✅ YES (${BREVO_API_KEY.substring(0, 20)}...)` : '❌ NO - NOT CONFIGURED');
console.log('🔹 Brevo API Key length:', BREVO_API_KEY ? BREVO_API_KEY.length : 0);
console.log('🔹 Sender Email:', BREVO_SENDER_EMAIL);
console.log('🔹 Sender Name:', BREVO_SENDER_NAME);

if (!BREVO_API_KEY) {
  console.log('⚠️⚠️⚠️ WARNING: BREVO_API_KEY NOT SET - EMAILS WILL FAIL ⚠️⚠️⚠️');
  console.log('   You must set BREVO_API_KEY in Render environment variables!');
}
console.log('═══════════════════════════════════════════════════════════\n');

/**
 * Send email via Brevo API
 * @param {string} toEmail - Recipient email
 * @param {string} toName - Recipient name
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email content (HTML)
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (toEmail, toName, subject, htmlContent) => {
  if (!BREVO_API_KEY) {
    console.log('⚠️ Brevo API key not configured - email would not be sent');
    console.log(`   📧 Email: To ${toEmail}, Subject: "${subject}"`);
    return false;
  }

  try {
    console.log(`📨 Sending email via Brevo: to=${toEmail}, subject="${subject}"`);
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL
        },
        to: [
          {
            email: toEmail,
            name: toName || 'User'
          }
        ],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    console.log(`↩️ Brevo response status: ${response.status}`);

    if (response.status === 200 || response.status === 201) {
      try {
        const data = await response.json();
        console.log('✅ Email sent successfully:', { to: toEmail, subject, messageId: data.messageId });
        return true;
      } catch (parseErr) {
        console.error('❌ Failed to parse success response:', parseErr.message);
        // Still consider it successful if status was 200/201
        return true;
      }
    } else {
      // Not successful
      try {
        const errorData = await response.json();
        console.error('❌ Brevo API error:', { status: response.status, ...errorData });
      } catch (parseErr) {
        const text = await response.text();
        console.error('❌ Brevo API error (non-JSON):', { status: response.status, text: text.substring(0, 200) });
      }
      return false;
    }
  } catch (err) {
    console.error('❌ Email fetch error:', err.message);
    return false;
  }
};

/**
 * Send password reset verification code email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} resetCode - 6-digit reset code
 * @param {string} resetLink - Optional reset link
 */
const sendPasswordResetEmail = async (email, name, resetCode, resetLink = null) => {
  console.log(`🔐 Preparing password reset email for: ${email}`);
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
        <p style="color: #333; font-size: 16px; margin-top: 0;">
          Hey ${name || 'Boss'},
        </p>
        
        <p style="color: #555; font-size: 14px; margin: 15px 0;">
          We received a request to reset your password. Use the code below to reset your password:
        </p>
        
        <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
          <p style="margin: 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Reset Code</p>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px;">${resetCode}</p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">This code expires in 30 minutes</p>
        </div>
        
        ${resetLink ? `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
              Reset Password
            </a>
          </div>
        ` : ''}
        
        <p style="color: #999; font-size: 12px; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          If you didn't request this password reset, please ignore this email. Your account remains secure.
        </p>
        
        <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
          © ${new Date().getFullYear()} Personal Assistant. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmail(email, name, '🔐 Reset Your Password - Personal Assistant', htmlContent);
    if (result) {
      console.log('✅ Password reset email sent successfully');
    } else {
      console.warn('⚠️ Password reset email sending returned false');
    }
    return result;
  } catch (err) {
    console.error('❌ Password reset email error:', err.message);
    return false;
  }
};

/**
 * Send email verification code
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} verificationCode - Email verification code
 */
const sendVerificationEmail = async (email, name, verificationCode) => {
  console.log(`📧 Preparing verification email for: ${email}, code: ${verificationCode}`);
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">✅ Verify Your Email</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
        <p style="color: #333; font-size: 16px; margin-top: 0;">
          Welcome to Personal Assistant, ${name || 'Boss'}!
        </p>
        
        <p style="color: #555; font-size: 14px; margin: 15px 0;">
          Verify your email address to complete your signup:
        </p>
        
        <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
          <p style="margin: 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px;">${verificationCode}</p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">This code expires in 24 hours</p>
        </div>
        
        <p style="color: #555; font-size: 13px; margin: 20px 0;">
          Start building better habits, routines, and managing your todos with your personal AI assistant.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
          © ${new Date().getFullYear()} Personal Assistant. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmail(email, name, '✅ Verify Your Email - Personal Assistant', htmlContent);
    if (result) {
      console.log('✅ Verification email sent successfully');
    } else {
      console.warn('⚠️ Verification email sending returned false');
    }
    return result;
  } catch (err) {
    console.error('❌ Verification email error:', err.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
};
