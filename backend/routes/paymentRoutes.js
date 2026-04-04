const express = require("express");
const { protect } = require("../middleware/auth.js");
const { createManualGift, createOrder, verifyPayment } = require("../controllers/paymentController.js");

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/manual', protect, createManualGift);

module.exports = router;
