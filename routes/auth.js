import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getUserById,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/user/:userId', getUserById);

export default router;
