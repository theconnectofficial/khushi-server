import {
  generateBlogContent,
  translateContent,
  generateTopicSuggestions,
  improveContent,
} from '../utils/gemini.js';
import Blog from '../models/Blog.js';

/**
 * @desc    Generate blog content from prompt
 * @route   POST /api/ai/generate
 * @access  Private
 */
export const generateContent = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const generatedContent = await generateBlogContent(prompt);

    res.json(generatedContent);
  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate content' });
  }
};

/**
 * @desc    Translate blog content
 * @route   POST /api/ai/translate
 * @access  Private
 */
export const translate = async (req, res) => {
  try {
    const { blogId, targetLanguage } = req.body;

    if (!blogId || !targetLanguage) {
      return res.status(400).json({ message: 'Blog ID and target language are required' });
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if translation already exists
    if (blog.translations && blog.translations.get(targetLanguage)) {
      return res.json(blog.translations.get(targetLanguage));
    }

    // Generate translation
    const translated = await translateContent(blog.content, blog.title, targetLanguage);

    // Save translation to blog
    if (!blog.translations) {
      blog.translations = new Map();
    }
    blog.translations.set(targetLanguage, {
      title: translated.title,
      content: translated.content,
      excerpt: translated.content.substring(0, 250) + '...',
    });

    await blog.save();

    res.json(translated);
  } catch (error) {
    console.error('Translate content error:', error);
    res.status(500).json({ message: error.message || 'Failed to translate content' });
  }
};

/**
 * @desc    Get topic suggestions based on user interests
 * @route   GET /api/ai/suggestions
 * @access  Private
 */
export const getSuggestions = async (req, res) => {
  try {
    const user = req.user;

    const interests = user.interests && user.interests.length > 0
      ? user.interests
      : ['technology', 'lifestyle', 'health'];

    const suggestions = await generateTopicSuggestions(interests);

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate suggestions' });
  }
};

/**
 * @desc    Improve existing content
 * @route   POST /api/ai/improve
 * @access  Private
 */
export const improve = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const improvedContent = await improveContent(content);

    res.json({ content: improvedContent });
  } catch (error) {
    console.error('Improve content error:', error);
    res.status(500).json({ message: error.message || 'Failed to improve content' });
  }
};
