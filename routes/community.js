import express from 'express';
import {
  getLeaderboard,
  getBadges,
  getStats,
} from '../controllers/communityController.js';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/badges', getBadges);
router.get('/stats', getStats);

export default router;
