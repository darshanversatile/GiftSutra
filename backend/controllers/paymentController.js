const Razorpay = require("razorpay");
const crypto = require("crypto");
const GiftTransaction = require("../models/GiftTransaction.js");
const Event = require("../models/Event.js");
const RSVP = require("../models/RSVP.js");
const { logger, auditLogger } = require("../utils/logger.js");

const isRazorpayConfigured = () =>
  !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;

// Initialize Razorpay
const getRazorpayInstance = () => {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const validateContributionEligibility = async (eventId, userId, userEmail) => {
  const event = await Event.findById(eventId);

  if (!event) {
    return {
      allowed: false,
      status: 404,
      payload: { success: false, message: "Event not found" },
    };
  }

  if (event.organizer.toString() === userId.toString()) {
    return {
      allowed: false,
      status: 403,
      payload: {
        success: false,
        message: "Event organizers cannot make payments for their own event",
      },
    };
  }

  const normalizedEmail = userEmail?.toLowerCase?.();
  const rsvp = normalizedEmail
    ? await RSVP.findOne({ eventId, email: normalizedEmail })
    : null;

  if (!rsvp || rsvp.status !== "accepted") {
    return {
      allowed: false,
      status: 403,
      payload: {
        success: false,
        message: "You must join the event before making a payment",
      },
    };
  }

  return { allowed: true, event };
};

exports.createOrder = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Online payments are not enabled yet",
      });
    }

    const { eventId, amount } = req.body;
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const eligibility = await validateContributionEligibility(
      eventId,
      req.user._id,
      req.user.email,
    );

    if (!eligibility.allowed) {
      return res.status(eligibility.status).json(eligibility.payload);
    }

    // Amount in Razorpay is expected in paise (multiply by 100)
    const options = {
      amount: Math.round(numericAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    logger.info(`Order created successfully`, {
      orderId: order.id,
      eventId,
      amount: numericAmount,
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    logger.error(`Error creating order`, {
      error: error,
      message: error?.message,
      stack: error?.stack,
      eventId: req.body.eventId,
      amount: req.body.amount,
    });
    res.status(500).json({
      success: false,
      message:
        error?.error?.description || // Razorpay error
        error?.message ||
        JSON.stringify(error) ||
        "Could not create order",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Online payments are not enabled yet",
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      amount,
    } = req.body;
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const eligibility = await validateContributionEligibility(
      eventId,
      req.user._id,
      req.user.email,
    );

    if (!eligibility.allowed) {
      return res.status(eligibility.status).json(eligibility.payload);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      auditLogger.warn(`Payment verification failed - Invalid signature`, {
        eventId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    // Save transaction
    const transaction = await GiftTransaction.create({
      userId: req.user._id, // Assume auth middleware sets req.user
      eventId,
      amount: numericAmount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "success",
      paymentMethod: "UPI", // Based on user request
      entryType: "online",
    });

    // Update Event Collected Amount
    await Event.findByIdAndUpdate(eventId, {
      $inc: { collectedAmount: numericAmount },
    });

    auditLogger.info(`Payment verified and transaction recorded`, {
      transactionId: transaction._id,
      eventId,
      amount: numericAmount,
      userId: req.user._id,
      paymentId: razorpay_payment_id,
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      transaction,
    });
  } catch (error) {
    logger.error(`Error verifying payment: ${error.message}`, {
      stack: error.stack,
      eventId: req.body.eventId,
    });
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createManualGift = async (req, res) => {
  try {
    const { eventId, amount, donorName, note, paymentMethod } = req.body;

    if (!eventId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Event and amount are required" });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than 0" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the event organizer can add manual gift entries",
      });
    }

    const manualOrderId = `manual_${Date.now()}`;
    const transaction = await GiftTransaction.create({
      userId: req.user._id,
      eventId,
      amount: numericAmount,
      orderId: manualOrderId,
      status: "success",
      paymentMethod: paymentMethod || "Cash",
      donorName: donorName?.trim() || "Anonymous",
      note: note?.trim() || "",
      entryType: "manual",
    });

    event.collectedAmount += numericAmount;
    await event.save();

    auditLogger.info(`Manual gift entry recorded`, {
      transactionId: transaction._id,
      eventId,
      organizerId: req.user._id,
      amount: numericAmount,
      donorName: transaction.donorName,
    });

    res.status(201).json({
      success: true,
      message: "Manual gift entry added",
      transaction,
      collectedAmount: event.collectedAmount,
    });
  } catch (error) {
    logger.error(`Error creating manual gift entry: ${error.message}`, {
      stack: error.stack,
      eventId: req.body.eventId,
      userId: req.user?._id,
    });
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
