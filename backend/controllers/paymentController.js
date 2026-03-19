import Razorpay from 'razorpay';
import crypto from 'crypto';
import GiftTransaction from '../models/GiftTransaction.js';
import Event from '../models/Event.js';
import { logger, auditLogger } from '../utils/logger.js';

// Initialize Razorpay
// Note: In a real app, instantiate inside the function or assure process.env is loaded before
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyHere',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YourTestSecretHere',
  });
};

export const createOrder = async (req, res) => {
  try {
    const { eventId, amount } = req.body;
    
    // Amount in Razorpay is expected in paise (multiply by 100)
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    logger.info(`Order created successfully`, { orderId: order.id, eventId, amount });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    logger.error(`Error creating order: ${error.message}`, { stack: error.stack, eventId: req.body.eventId, amount: req.body.amount });
    res.status(500).json({ success: false, message: 'Could not create order' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      eventId,
      amount
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'YourTestSecretHere';

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      auditLogger.warn(`Payment verification failed - Invalid signature`, { eventId, orderId: razorpay_order_id, paymentId: razorpay_payment_id });
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Save transaction
    const transaction = await GiftTransaction.create({
      userId: req.user._id, // Assume auth middleware sets req.user
      eventId,
      amount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'success',
      paymentMethod: 'UPI' // Based on user request
    });

    // Update Event Collected Amount
    await Event.findByIdAndUpdate(eventId, {
      $inc: { collectedAmount: amount }
    });

    auditLogger.info(`Payment verified and transaction recorded`, { transactionId: transaction._id, eventId, amount, userId: req.user._id, paymentId: razorpay_payment_id });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      transaction
    });
  } catch (error) {
    logger.error(`Error verifying payment: ${error.message}`, { stack: error.stack, eventId: req.body.eventId });
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
