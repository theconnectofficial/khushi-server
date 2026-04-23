import User from '../models/User.js';
import Blog from '../models/Blog.js';
import { BADGES } from '../models/Badge.js';

/**
 * @desc    Get leaderboard (top users by points)
 * @route   GET /api/community/leaderboard
 * @access  Public
 */
export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topUsers = await User.find()
      .select('name avatar points level badges')
      .sort({ points: -1 })
      .limit(limit);

    res.json({ leaderboard: topUsers });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
};

/**
 * @desc    Get all available badges
 * @route   GET /api/community/badges
 * @access  Public
 */
export const getBadges = async (req, res) => {
  try {
    res.json({ badges: BADGES });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ message: 'Server error fetching badges' });
  }
};

/**
 * @desc    Get platform statistics
 * @route   GET /api/community/stats
 * @access  Public
 */
export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBlogs = await Blog.countDocuments({ status: 'published' });
    
    // Get unique languages
    const languages = await Blog.distinct('language');
    
    // Get total views
    const viewsResult = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);
    const totalViews = viewsResult[0]?.totalViews || 0;

    // Get most popular tags
    const popularTags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalBlogs,
        totalLanguages: languages.length,
        totalViews,
        popularTags: popularTags.map((tag) => ({ name: tag._id, count: tag.count })),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
};
