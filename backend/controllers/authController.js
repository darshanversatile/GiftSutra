import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger, auditLogger } from '../utils/logger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(`Registration failed: User already exists - ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      const token = generateToken(user._id);
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      auditLogger.info(`User registered successfully`, { userId: user._id, email: user.email });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      });
    } else {
      logger.warn(`Registration failed: Invalid user data - ${email}`);
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    logger.error(`Registration error: ${error.message}`, { stack: error.stack, email: req.body.email });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user._id);
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      auditLogger.info(`User logged in successfully`, { userId: user._id, email: user.email });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      });
    } else {
      logger.warn(`Login failed: Invalid credentials for ${email}`);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    logger.error(`Login error: ${error.message}`, { stack: error.stack, email: req.body.email });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  auditLogger.info(`User logged out`, { userId: req.user ? req.user._id : 'unknown' });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
    logger.error(`Update profile error: ${error.message}`, { stack: error.stack, userId: req.user._id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
