const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST || 'gmail.com',
//     auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//     },
// });



exports.sendInvitationEmail = async (to, eventDetails, invitationLink) => {


  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // App password
    },
  });

  console.log('Email transporter configured with:', {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // Don't log the actual password
    }
  });

  const { title, description, date, organizerName } = eventDetails;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const mailOptions = {
    from: `"GiftSutra" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject: `You're Invited: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">You're Invited! 🎉</h2>
        
        <p style="font-size: 16px; color: #333;">Hello,</p>
        
        <p style="font-size: 16px; color: #333;">
          <strong>${organizerName}</strong> has invited you to join an event on <strong>GiftSutra</strong>.
        </p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4f46e5; margin-top: 0;">${title}</h3>
          <p style="color: #666; margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="color: #666; margin: 10px 0;"><strong>Description:</strong> ${description}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Event & Join
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${invitationLink}" style="color: #4f46e5;">${invitationLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Sent by GiftSutra - The perfect way to celebrate together
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Invitation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    // } catch (error) {
    //     console.error('Error sending invitation email:', error);
    //     throw new Error('Failed to send invitation email');
    // }
  } catch (error) {
    console.error('FULL ERROR:', error); // <-- THIS is critical
    throw error; // don't hide real error
  }
};

exports.sendPasswordResetEmail = async (to, resetLink) => {

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // App password
    },
  });

  console.log('Email transporter configured with:', {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // Don't log the actual password
    }
  });

  const mailOptions = {
    from: `"GiftSutra" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your GiftSutra password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Reset your password</h2>
        <p style="font-size: 16px; color: #333;">We received a request to reset your GiftSutra password.</p>
        <p style="font-size: 16px; color: #333;">Use the button below to choose a new password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #4f46e5;">${resetLink}</a>
        </p>
        <p style="font-size: 14px; color: #999;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

