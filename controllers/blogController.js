import Blog from '../models/Blog.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import { POINTS_CONFIG, BADGES } from '../models/Badge.js';

/**
 * Helper function to award points and check for badges
 */
const awardPointsAndBadges = async (userId, pointsType) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Award points
    user.points += POINTS_CONFIG[pointsType];
    user.calculateLevel();

    // Check for new badges
    const blogsCount = await Blog.countDocuments({ author: userId, status: 'published' });
    const commentsCount = await Comment.countDocuments({ author: userId });
    const aiGeneratedCount = await Blog.countDocuments({ author: userId, isAIGenerated: true });
    
    const totalLikesResult = await Blog.aggregate([
      { $match: { author: userId } },
      { $project: { likesCount: { $size: '$likes' } } },
      { $group: { _id: null, total: { $sum: '$likesCount' } } },
    ]);
    const totalLikes = totalLikesResult[0]?.total || 0;

    // Unique languages read
    const languagesRead = new Set(user.blogsRead.map((b) => b.language)).size;

    const userBadgeNames = user.badges.map((b) => b.name);

    BADGES.forEach((badge) => {
      if (userBadgeNames.includes(badge.name)) return;

      let shouldAward = false;

      if (badge.criteria.blogsPublished && blogsCount >= badge.criteria.blogsPublished) {
        shouldAward = true;
      }
      if (badge.criteria.commentsPosted && commentsCount >= badge.criteria.commentsPosted) {
        shouldAward = true;
      }
      if (badge.criteria.totalLikes && totalLikes >= badge.criteria.totalLikes) {
        shouldAward = true;
      }
      if (badge.criteria.points && user.points >= badge.criteria.points) {
        shouldAward = true;
      }
      if (badge.criteria.languagesRead && languagesRead >= badge.criteria.languagesRead) {
        shouldAward = true;
      }
      if (badge.criteria.aiGeneratedBlogs && aiGeneratedCount >= badge.criteria.aiGeneratedBlogs) {
        shouldAward = true;
      }

      if (shouldAward) {
        user.badges.push({ name: badge.name });
      }
    });

    await user.save();
  } catch (error) {
    console.error('Error awarding points/badges:', error);
  }
};

/**
 * @desc    Create a new blog
 * @route   POST /api/blog
 * @access  Private
 */
export const createBlog = async (req, res) => {
  try {
    const { title, content, coverImage, tags, seoKeywords, language, isAIGenerated } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const blog = await Blog.create({
      title,
      content,
      coverImage,
      tags,
      seoKeywords,
      language: language || 'en',
      isAIGenerated: isAIGenerated || false,
      author: req.user._id,
    });

    const populatedBlog = await Blog.findById(blog._id).populate('author', 'name avatar points badges');

    // Award points for publishing
    await awardPointsAndBadges(req.user._id, 'BLOG_PUBLISHED');

    res.status(201).json(populatedBlog);
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ message: 'Server error creating blog' });
  }
};

/**
 * @desc    Get all blogs (with pagination and filters)
 * @route   GET /api/blog
 * @access  Public
 */
export const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { tag, language, search, author } = req.query;

    let filter = { status: 'published' };

    if (tag) filter.tags = tag;
    if (language) filter.language = language;
    if (author) filter.author = author;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const blogs = await Blog.find(filter)
      .populate('author', 'name avatar points badges')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(filter);

    res.json({
      blogs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlogs: total,
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ message: 'Server error fetching blogs' });
  }
};

/**
 * @desc    Get personalized blog feed
 * @route   GET /api/blog/feed/personalized
 * @access  Private
 */
export const getPersonalizedFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.interests || user.interests.length === 0) {
      // If no interests, return recent blogs
      const blogs = await Blog.find({ status: 'published' })
        .populate('author', 'name avatar points badges')
        .sort({ createdAt: -1 })
        .limit(20);
      return res.json({ blogs });
    }

    // Find blogs matching user interests
    const blogs = await Blog.find({
      status: 'published',
      tags: { $in: user.interests },
    })
      .populate('author', 'name avatar points badges')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ blogs });
  } catch (error) {
    console.error('Get personalized feed error:', error);
    res.status(500).json({ message: 'Server error fetching feed' });
  }
};

/**
 * @desc    Get single blog by ID or slug
 * @route   GET /api/blog/:id
 * @access  Public
 */
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const { language } = req.query;

    let blog = await Blog.findById(id).populate('author', 'name avatar points badges level');

    if (!blog) {
      // Try finding by slug
      blog = await Blog.findOne({ slug: id }).populate('author', 'name avatar points badges level');
    }

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Increment views only if viewer is not the author
    const isAuthor = req.user && blog.author._id.toString() === req.user._id.toString();
    if (!isAuthor) {
      blog.views += 1;
      await blog.save();
    }

    // Track language read for user if authenticated
    if (req.user && language) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.blogsRead.push({
          blogId: blog._id,
          language: language || blog.language,
        });
        await user.save();
      }
    }

    // Get comments
    const comments = await Comment.find({ blog: blog._id })
      .populate('author', 'name avatar points badges')
      .sort({ createdAt: -1 });

    res.json({ blog, comments });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ message: 'Server error fetching blog' });
  }
};

/**
 * @desc    Update blog
 * @route   PUT /api/blog/:id
 * @access  Private
 */
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check ownership
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this blog' });
    }

    const { title, content, coverImage, tags, seoKeywords, status } = req.body;

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (tags) blog.tags = tags;
    if (seoKeywords) blog.seoKeywords = seoKeywords;
    if (status) blog.status = status;

    const updatedBlog = await blog.save();
    const populatedBlog = await Blog.findById(updatedBlog._id).populate('author', 'name avatar points badges');

    res.json(populatedBlog);
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ message: 'Server error updating blog' });
  }
};

/**
 * @desc    Delete blog
 * @route   DELETE /api/blog/:id
 * @access  Private
 */
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check ownership
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    await blog.deleteOne();
    await Comment.deleteMany({ blog: blog._id });

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: 'Server error deleting blog' });
  }
};

/**
 * @desc    Like/unlike a blog
 * @route   POST /api/blog/:id/like
 * @access  Private
 */
export const toggleLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const likeIndex = blog.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
      // Unlike
      blog.likes.splice(likeIndex, 1);
    } else {
      // Like
      blog.likes.push(req.user._id);
    }

    await blog.save();

    res.json({ likes: blog.likes.length, isLiked: likeIndex === -1 });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error toggling like' });
  }
};

/**
 * @desc    Add comment to blog
 * @route   POST /api/blog/:id/comment
 * @access  Private
 */
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = await Comment.create({
      blog: blog._id,
      author: req.user._id,
      content,
    });

    blog.commentsCount += 1;
    await blog.save();

    // Award points for commenting
    await awardPointsAndBadges(req.user._id, 'COMMENT_POSTED');

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar points badges');

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
};
