export const BADGES = [
  {
    name: 'First Steps',
    description: 'Published your first blog',
    icon: '🌱',
    criteria: { blogsPublished: 1 },
  },
  {
    name: 'Frequent Writer',
    description: 'Published 10 or more blogs',
    icon: '✍️',
    criteria: { blogsPublished: 10 },
  },
  {
    name: 'Prolific Author',
    description: 'Published 50 or more blogs',
    icon: '📚',
    criteria: { blogsPublished: 50 },
  },
  {
    name: 'Polyglot',
    description: 'Read blogs in 5 different languages',
    icon: '🌍',
    criteria: { languagesRead: 5 },
  },
  {
    name: 'Community Star',
    description: 'Received 100 likes on your blogs',
    icon: '⭐',
    criteria: { totalLikes: 100 },
  },
  {
    name: 'Conversationalist',
    description: 'Posted 50 comments',
    icon: '💬',
    criteria: { commentsPosted: 50 },
  },
  {
    name: 'AI Pioneer',
    description: 'Used AI to generate 5 blog posts',
    icon: '🤖',
    criteria: { aiGeneratedBlogs: 5 },
  },
  {
    name: 'Top Contributor',
    description: 'Reached 1000 points',
    icon: '🏆',
    criteria: { points: 1000 },
  },
];

export const POINTS_CONFIG = {
  BLOG_PUBLISHED: 10,
  COMMENT_POSTED: 2,
  BLOG_LIKED: 1,
  BLOG_VIEW: 0, // No points for views to prevent gaming
};
