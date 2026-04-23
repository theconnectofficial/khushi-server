import express from 'express';
import {
  generateContent,
  translate,
  getSuggestions,
  improve,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateContent);
router.post('/translate', protect, translate);
router.get('/suggestions', protect, getSuggestions);
router.post('/improve', protect, improve);

export default router;
