import mongoose from 'mongoose';

const giftTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: 'UPI', 
    },
  },
  { timestamps: true }
);

const GiftTransaction = mongoose.model('GiftTransaction', giftTransactionSchema);
export default GiftTransaction;
