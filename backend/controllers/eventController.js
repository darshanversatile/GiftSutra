import Event from '../models/Event.js';
import GiftTransaction from '../models/GiftTransaction.js';
import { logger, auditLogger } from '../utils/logger.js';

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, targetAmount, coverImage } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      targetAmount,
      coverImage,
      organizer: req.user._id,
    });

    auditLogger.info(`Event created`, { eventId: event._id, organizerId: req.user._id, title });
    res.status(201).json(event);
  } catch (error) {
    logger.error(`Create event error: ${error.message}`, { stack: error.stack, userId: req.user._id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    logger.error(`Get events error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');

    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyGifts = async (req, res) => {
  try {
    const transactions = await GiftTransaction.find({ userId: req.user._id })
      .populate('eventId', 'title date')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
