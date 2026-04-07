const Event = require("../models/Event.js");
const GiftTransaction = require("../models/GiftTransaction.js");
const User = require("../models/User.js");
const RSVP = require("../models/RSVP.js");
const { sendInvitationEmail } = require("../utils/emailService.js");
const { logger, auditLogger } = require("../utils/logger.js");

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, targetAmount, coverImage, isPrivate, passcode } = req.body;
    const dateValue = typeof date === 'string' ? date : '';
    const [year = ''] = dateValue.split('-');

    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json({ message: 'Event year must be exactly 4 digits' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      targetAmount,
      coverImage,
      isPrivate,
      passcode,
      organizer: req.user._id,
    });

    auditLogger.info(`Event created`, { eventId: event._id, organizerId: req.user._id, title });
    res.status(201).json(event);
  } catch (error) {
    logger.error(`Create event error: ${error.message}`, { stack: error.stack, userId: req.user._id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ isPrivate: { $ne: true } }).populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    logger.error(`Get events error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.isPrivate) {
      const isOrganizer = req.user && req.user._id.toString() === event.organizer._id.toString();
      const providedPasscode = req.query.passcode || req.headers['x-passcode'];

      if (!isOrganizer && event.passcode && providedPasscode !== event.passcode) {
        return res.status(403).json({ message: 'Passcode required to view this event', isPrivate: true });
      }
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getJoinedEvents = async (req, res) => {
  try {
    const joinedRsvps = await RSVP.find({
      userId: req.user._id,
      status: { $in: ['accepted', 'attended'] },
    })
      .populate({
        path: 'eventId',
        populate: { path: 'organizer', select: 'name email' },
      })
      .sort({ respondedAt: -1, createdAt: -1 });

    const joinedEvents = joinedRsvps
      .filter((rsvp) => rsvp.eventId)
      .map((rsvp) => ({
        ...rsvp.eventId.toObject(),
        joinedAt: rsvp.respondedAt || rsvp.updatedAt || rsvp.createdAt,
        rsvpStatus: rsvp.status,
      }));

    res.json(joinedEvents);
  } catch (error) {
    logger.error(`Get joined events error: ${error.message}`, { stack: error.stack, userId: req.user?._id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyGifts = async (req, res) => {
  try {
    const transactions = await GiftTransaction.find({ userId: req.user._id })
      .populate('eventId', 'title date')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEventGifts = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isOrganizer = req.user && req.user._id.toString() === event.organizer._id.toString();

    if (!isOrganizer) {
      return res.status(403).json({ message: 'Only the event organizer can view contributions' });
    }

    const transactions = await GiftTransaction.find({
      eventId: id,
      status: 'success',
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const gifts = transactions.map((transaction) => ({
      _id: transaction._id,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      note: transaction.note,
      entryType: transaction.entryType,
      createdAt: transaction.createdAt,
      contributorName:
        transaction.entryType === 'manual'
          ? transaction.donorName || 'Anonymous'
          : transaction.userId?.name || transaction.donorName || 'Unknown',
      contributorEmail:
        transaction.entryType === 'manual'
          ? ''
          : transaction.userId?.email || '',
    }));

    res.json(gifts);
  } catch (error) {
    logger.error(`Get event gifts error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.sendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const event = await Event.findById(id).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the user is the organizer
    if (event.organizer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the event organizer can send invitations' });
    }

    // Check if already invited
    const existingRSVP = await RSVP.findOne({ eventId: id, email: email.toLowerCase() });
    if (existingRSVP) {
      return res.status(400).json({ message: 'This email has already been invited to this event' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationLink = `${frontendUrl}/events/${id}`;

    // Create RSVP record
    const rsvp = await RSVP.create({
      eventId: id,
      email: email.toLowerCase(),
      status: 'invited',
      invitedAt: new Date(),
    });

    await sendInvitationEmail(email, {
      title: event.title,
      description: event.description,
      date: event.date,
      organizerName: event.organizer.name,
    }, invitationLink);

    auditLogger.info(`Invitation sent`, { eventId: id, organizerId: req.user._id, invitedEmail: email, rsvpId: rsvp._id });
    res.json({ message: 'Invitation sent successfully', rsvp });
  } catch (error) {
    logger.error(`Send invitation error: ${error.message}`, { stack: error.stack, userId: req.user._id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const providedPasscode = req.body?.passcode || req.headers['x-passcode'];
    const event = await Event.findById(id).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You are already the organizer of this event' });
    }

    if (event.isPrivate && event.passcode && providedPasscode !== event.passcode) {
      return res.status(403).json({ message: 'Passcode required to join this event', isPrivate: true });
    }

    const email = req.user.email?.toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'A valid account email is required to join this event' });
    }

    let rsvp = await RSVP.findOne({ eventId: id, email });

    if (!rsvp) {
      rsvp = await RSVP.create({
        eventId: id,
        email,
        userId: req.user._id,
        status: 'accepted',
        invitedAt: new Date(),
        respondedAt: new Date(),
      });
    } else {
      rsvp.userId = req.user._id;
      rsvp.status = 'accepted';
      rsvp.respondedAt = new Date();
      await rsvp.save();
    }

    auditLogger.info(`Event joined`, {
      eventId: id,
      userId: req.user._id,
      email,
      rsvpId: rsvp._id,
    });

    res.json({ message: 'You joined the event successfully', rsvp });
  } catch (error) {
    logger.error(`Join event error: ${error.message}`, { stack: error.stack, userId: req.user?._id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// RSVP Response - Accept/Decline/Maybe
exports.respondToInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, status, notes } = req.body;

    if (!email || !status) {
      return res.status(400).json({ message: 'Email and status are required' });
    }

    if (!['accepted', 'declined', 'maybe'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be accepted, declined, or maybe' });
    }

    const rsvp = await RSVP.findOne({ eventId: id, email: email.toLowerCase() });

    if (!rsvp) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    rsvp.status = status;
    rsvp.respondedAt = new Date();
    if (notes) rsvp.notes = notes;

    // If user is logged in, link the userId
    if (req.user) {
      rsvp.userId = req.user._id;
    }

    await rsvp.save();

    auditLogger.info(`RSVP response`, { eventId: id, email, status, userId: req.user?._id });
    res.json({ message: `You have ${status} the invitation`, rsvp });
  } catch (error) {
    logger.error(`RSVP response error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark attendance (for organizer)
exports.markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { rsvpId, attended, notes } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only organizer can mark attendance
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the event organizer can mark attendance' });
    }

    const rsvp = await RSVP.findById(rsvpId);
    if (!rsvp || rsvp.eventId.toString() !== id) {
      return res.status(404).json({ message: 'RSVP not found' });
    }

    rsvp.status = attended ? 'attended' : 'no_show';
    rsvp.attendedAt = attended ? new Date() : null;
    if (notes) rsvp.notes = notes;

    await rsvp.save();

    auditLogger.info(`Attendance marked`, { eventId: id, rsvpId, attended, organizerId: req.user._id });
    res.json({ message: `Attendance marked as ${attended ? 'attended' : 'no show'}`, rsvp });
  } catch (error) {
    logger.error(`Mark attendance error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance list for an event (organizer only)
exports.getAttendanceList = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only organizer can view attendance list
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the event organizer can view attendance' });
    }

    const rsvps = await RSVP.find({ eventId: id })
      .populate('userId', 'name email')
      .sort({ invitedAt: -1 });

    // Calculate stats
    const stats = {
      totalInvited: rsvps.length,
      accepted: rsvps.filter(r => r.status === 'accepted').length,
      declined: rsvps.filter(r => r.status === 'declined').length,
      maybe: rsvps.filter(r => r.status === 'maybe').length,
      attended: rsvps.filter(r => r.status === 'attended').length,
      noShow: rsvps.filter(r => r.status === 'no_show').length,
      pending: rsvps.filter(r => r.status === 'invited').length,
    };

    res.json({ rsvps, stats });
  } catch (error) {
    logger.error(`Get attendance list error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get my RSVP status for an event
exports.getMyRSVP = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const rsvp = await RSVP.findOne({ eventId: id, email: email.toLowerCase() });

    if (!rsvp) {
      return res.status(404).json({ message: 'No invitation found for this email' });
    }

    res.json(rsvp);
  } catch (error) {
    logger.error(`Get my RSVP error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
