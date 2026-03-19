import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { logger } from './utils/logger.js';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

connectDB();

const app = express();


app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP request logging with morgan and winston
const morganStream = {
  write: (message) => logger.info(message.trim())
};
app.use(morgan('combined', { stream: morganStream }));

// Output the key length to console to ensure env is loading
console.log(`Razorpay Key ID Load Check: ${process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.length : 'MISSING'}`);

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => res.send('API is running...'));

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
