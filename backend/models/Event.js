import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverImage: {
      type: String,
    },
    targetAmount: {
      type: Number,
      default: 0,
    },
    collectedAmount: {
      type: Number,
      default: 0,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    passcode: {
      type: String,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
