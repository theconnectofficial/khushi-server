import express from 'express';
import { uploadImage, upload } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Upload image - protected route (requires authentication)
router.post('/', protect, upload.single('image'), uploadImage);

export default router;
