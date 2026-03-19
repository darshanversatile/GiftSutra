import express from 'express';
import { createEvent, getEvents, getEventById, getMyEvents, getMyGifts } from '../controllers/eventController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(protect, createEvent);

router.get('/myevents', protect, getMyEvents);
router.get('/mygifts', protect, getMyGifts);
router.get('/:id', optionalAuth, getEventById);

export default router;
