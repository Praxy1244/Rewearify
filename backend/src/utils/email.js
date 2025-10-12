import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email service (e.g., SendGrid, AWS SES)
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development - use Ethereal or console
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
      }
    });
  }
};

// Send email function
export const sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'ReWearify'}" <${process.env.EMAIL_FROM || 'noreply@rewearify.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent:', {
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      });
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
    };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

// Email templates
export const emailTemplates = {
  // Welcome email
  welcome: (name, verificationUrl) => ({
    subject: 'Welcome to ReWearify!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to ReWearify, ${name}!</h1>
        <p>Thank you for joining our community of donors and recipients working together to make a difference.</p>
        <p>To get started, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>Best regards,<br>The ReWearify Team</p>
      </div>
    `
  }),

  // Password reset email
  passwordReset: (name, resetUrl) => ({
    subject: 'Reset Your ReWearify Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password for your ReWearify account.</p>
        <p>Click the button below to reset your password (valid for 15 minutes):</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>Best regards,<br>The ReWearify Team</p>
      </div>
    `
  }),

  // Donation approved email
  donationApproved: (name, donationTitle, donationId) => ({
    subject: 'Your Donation Has Been Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Donation Approved! 🎉</h1>
        <p>Hi ${name},</p>
        <p>Great news! Your donation "<strong>${donationTitle}</strong>" has been approved and is now live on our platform.</p>
        <p>NGOs and recipients can now view and request your donation. We'll notify you when there are interested parties.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/donor/my-donations" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View My Donations</a>
        </div>
        <p>Thank you for your generosity!</p>
        <p>Best regards,<br>The ReWearify Team</p>
      </div>
    `
  }),

  // Match notification email
  matchFound: (name, donationTitle, ngoName, matchScore) => ({
    subject: 'Perfect Match Found for Your Donation!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Perfect Match Found! 🎯</h1>
        <p>Hi ${name},</p>
        <p>We found a great match for your donation "<strong>${donationTitle}</strong>"!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Match Details:</h3>
          <p><strong>NGO:</strong> ${ngoName}</p>
          <p><strong>Match Score:</strong> ${Math.round(matchScore * 100)}%</p>
        </div>
        <p>The NGO has been notified and may contact you soon to arrange pickup or delivery.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/donor/my-donations" style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Match Details</a>
        </div>
        <p>Thank you for making a difference!</p>
        <p>Best regards,<br>The ReWearify Team</p>
      </div>
    `
  }),

  // Request fulfilled email
  requestFulfilled: (name, requestTitle, donorName) => ({
    subject: 'Your Request Has Been Fulfilled!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Request Fulfilled! 🙏</h1>
        <p>Hi ${name},</p>
        <p>Wonderful news! Your request "<strong>${requestTitle}</strong>" has been fulfilled by ${donorName}.</p>
        <p>The donor will be in touch soon to arrange delivery or pickup of the donated items.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/recipient/my-requests" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Request Details</a>
        </div>
        <p>We hope these items will make a positive impact for your beneficiaries.</p>
        <p>Best regards,<br>The ReWearify Team</p>
      </div>
    `
  })
};

// Send template email
export const sendTemplateEmail = async (to, templateName, templateData) => {
  try {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(...Object.values(templateData));
    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error('Template email error:', error);
    throw error;
  }
};

// Bulk email function
export const sendBulkEmail = async (recipients, subject, html) => {
  try {
    const transporter = createTransporter();
    const results = [];

    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: `"${process.env.APP_NAME || 'ReWearify'}" <${process.env.EMAIL_FROM || 'noreply@rewearify.com'}>`,
          to: recipient.email,
          subject: subject.replace('{{name}}', recipient.name),
          html: html.replace(/{{name}}/g, recipient.name)
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({
          email: recipient.email,
          success: true,
          messageId: info.messageId
        });
      } catch (error) {
        results.push({
          email: recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Bulk email error:', error);
    throw error;
  }
};

export default {
  sendEmail,
  sendTemplateEmail,
  sendBulkEmail,
  emailTemplates
};