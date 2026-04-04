const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const { logger, auditLogger } = require("../utils/logger.js");
const { sendPasswordResetEmail } = require("../utils/emailService.js");
const nodemailer = require("nodemailer");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const sendEmailOtp = (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "Your OTP",
    html: `
        <br/>
        <br/>
      <center style="width:100%">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
      <div style="text-align: center;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p style="font-size: 16px; color: #555;">Use the code below to complete your action.
        <div style="font-size: 32px; font-weight: bold; margin: 20px auto; color: #1a73e8; background-color: #e8f0fe; padding: 15px 25px; border-radius: 8px; display: inline-block;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #888;">If you did not request this code, please ignore this email.</p>
      </div>
     </div>
     
     </center>
     `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
  return true;
};

const sendEmail = (email, subject, html, file) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: subject,
    html,
    attachments: file
      ? [
          {
            filename: file.originalname,
            path: file.path,
          },
        ]
      : [],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
  return true;
};

const registerUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(`Registration failed: User already exists - ${email}`);
      return res.status(400).json({ message: "User already exists" });
    }

    const OTP = generateOTP();
    const user = await User.create({
      name,
      email,
      otp: OTP,
    });

    if (user) {
      sendEmailOtp(user.email, OTP);
      auditLogger.info(`User registered successfully`, {
        userId: user._id,
        email: user.email,
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      });
    } else {
      logger.warn(`Registration failed: Invalid user data - ${email}`);
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    logger.error(`Registration error: ${error.message}`, {
      stack: error.stack,
      email: req.body.email,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: "30d",
  });
};

const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const OTP = generateOTP();
      user.otp = OTP;
      await user.save();

      sendEmailOtp(user.email, OTP);

      auditLogger.info(`OTP generated for login`, {
        userId: user._id,
        email: user.email,
      });

      res.status(200).json({ message: "OTP sent to email", email: user.email });
    } else {
      logger.warn(`Login failed: User not found for ${email}`);
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    logger.error(`Login error: ${error.message}`, {
      stack: error.stack,
      email: req.body.email,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  auditLogger.info(`User logged out`, {
    userId: req.user ? req.user._id : "unknown",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    auditLogger.info(`User profile updated`, { userId: updatedUser._id });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`, {
      stack: error.stack,
      userId: req.user._id,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists for this email, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user.email, resetLink);

    auditLogger.info("Password reset requested", {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      message:
        "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`, {
      stack: error.stack,
      email: req.body.email,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);


    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    auditLogger.info("Password reset completed", {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  verifyOTP,
};
