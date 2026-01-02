import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email service (e.g., SendGrid, AWS SES)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development - use Ethereal or console
    return nodemailer.createTransport({
    host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER,
      pass: process.env.ETHEREAL_PASS
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
       console.log('📬 Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
    };
  } catch (error) {
    console.error('Email sending error:', error);
    // This throw is important to let the calling function know it failed
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
  }),

  // Congratulations email for donors
  congratulations: (donorName, recipientName, rating, comment, beneficiariesHelped, impactStory, totalDonations, totalBeneficiaries, newAchievements, requestId) => ({
    subject: `🎉 Congratulations ${donorName}! Your donation made a real impact!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 12px;">
        <div style="background: white; padding: 40px; border-radius: 10px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; font-size: 32px; margin: 0;">🎉 Congratulations!</h1>
            <p style="color: #4b5563; font-size: 18px; margin: 10px 0 0 0;">You've Made a Real Difference!</p>
          </div>

          <!-- Greeting -->
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">Hi <strong>${donorName}</strong>,</p>
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">
            We're thrilled to share that your donation has been successfully received and is making a real impact! 
            <strong>${recipientName}</strong> has shared their heartfelt feedback.
          </p>

          <!-- Rating Section -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">
              ${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)}
            </div>
            <p style="color: #92400e; font-size: 24px; font-weight: bold; margin: 0;">${rating}.0 / 5.0 Rating</p>
            <p style="color: #78350f; font-size: 14px; margin: 10px 0 0 0;">From ${recipientName}</p>
          </div>

          <!-- Feedback Comment -->
          ${comment ? `
          <div style="background: #f9fafb; padding: 20px; border-left: 4px solid #667eea; border-radius: 6px; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">💬 Recipient's Feedback:</p>
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0; font-style: italic;">"${comment}"</p>
          </div>
          ` : ''}

          <!-- Impact Stats -->
          <div style="background: #f0fdf4; padding: 25px; border-radius: 10px; margin: 25px 0;">
            <h2 style="color: #059669; font-size: 20px; margin: 0 0 20px 0; text-align: center;">📊 Impact Summary</h2>
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">
              <div style="text-align: center;">
                <p style="color: #059669; font-size: 36px; font-weight: bold; margin: 0;">${beneficiariesHelped || 0}</p>
                <p style="color: #047857; font-size: 14px; margin: 5px 0 0 0;">Lives Touched</p>
              </div>
              ${impactStory ? `
              <div style="text-align: center; flex: 1; min-width: 200px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">📖 Impact Story:</p>
                <p style="color: #1f2937; font-size: 14px; line-height: 1.5; margin: 0;">${impactStory}</p>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Lifetime Stats -->
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 10px; margin: 25px 0;">
            <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 20px 0; text-align: center;">🏆 Your Lifetime Impact</h2>
            <div style="display: flex; justify-content: space-around; text-align: center;">
              <div>
                <p style="color: #1e40af; font-size: 32px; font-weight: bold; margin: 0;">${totalDonations}</p>
                <p style="color: #1e3a8a; font-size: 14px; margin: 5px 0 0 0;">Total Donations</p>
              </div>
              <div>
                <p style="color: #1e40af; font-size: 32px; font-weight: bold; margin: 0;">${totalBeneficiaries}</p>
                <p style="color: #1e3a8a; font-size: 14px; margin: 5px 0 0 0;">Total Lives Helped</p>
              </div>
            </div>
          </div>

          <!-- New Achievements -->
          ${newAchievements && newAchievements.length > 0 ? `
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; margin: 25px 0;">
            <h2 style="color: #92400e; font-size: 20px; margin: 0 0 20px 0; text-align: center;">🎖️ New Achievements Unlocked!</h2>
            ${newAchievements.map(achievement => `
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 36px;">${achievement.icon}</div>
                <div>
                  <p style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0;">${achievement.title}</p>
                  <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">${achievement.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Call to Action -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.FRONTEND_URL}/donor/congratulations/${requestId}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: 600;">
              🎉 View Full Impact Report
            </a>
          </div>

          <!-- Closing -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">
              Thank you for being an incredible part of our community! Your generosity is changing lives and creating a better world.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              With gratitude,<br>
              <strong style="color: #667eea;">The ReWearify Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">
              Keep making a difference! Every donation matters. 💙
            </p>
          </div>
        </div>
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