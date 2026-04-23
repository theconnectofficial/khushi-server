import express from 'express';
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleLike,
  addComment,
  getPersonalizedFeed,
} from '../controllers/blogController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createBlog);
router.get('/', getBlogs);
router.get('/feed/personalized', protect, getPersonalizedFeed);
router.get('/:id', optionalAuth, getBlogById);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);

export default router;
