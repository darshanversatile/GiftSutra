const express = require("express");
const {
  createEvent,
  getEvents,
  getEventById,
  getEventGifts,
  getMyEvents,
  getMyGifts,
  sendInvitation,
  respondToInvitation,
  markAttendance,
  getAttendanceList,
  getMyRSVP
} = require("../controllers/eventController.js");
const { protect, optionalAuth } = require("../middleware/auth.js");

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(protect, createEvent);

router.get('/myevents', protect, getMyEvents);
router.get('/mygifts', protect, getMyGifts);

// Invitation & RSVP routes
router.get('/:id/gifts', optionalAuth, getEventGifts);
router.post('/:id/invite', protect, sendInvitation);
router.post('/:id/rsvp', optionalAuth, respondToInvitation);
router.get('/:id/rsvp', getMyRSVP);
router.get('/:id/attendance', protect, getAttendanceList);
router.post('/:id/attendance', protect, markAttendance);

router.get('/:id', optionalAuth, getEventById);

module.exports = router;
