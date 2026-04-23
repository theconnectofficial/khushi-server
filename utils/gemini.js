import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate blog content from a prompt using Gemini AI
 * @param {string} prompt - User's content prompt
 * @returns {Promise<{title: string, content: string, seoKeywords: string[]}>}
 */
export const generateBlogContent = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const enhancedPrompt = `Generate a blog post about: "${prompt}"

Return ONLY a JSON object with this exact format:
{
  "title": "An engaging SEO-friendly title",
  "content": "Full blog post content (minimum 500 words with proper paragraphs)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Unable to parse Gemini response');
    }

    const blogData = JSON.parse(jsonMatch[0]);
    return {
      title: blogData.title,
      content: blogData.content,
      seoKeywords: blogData.seoKeywords || [],
    };
  } catch (error) {
    console.error('Error generating blog content:', error);
    throw new Error('Failed to generate content. Please try again.');
  }
};

/**
 * Translate blog content to target language using MyMemory Translation API
 * Free API with no rate limits - uses native fetch, no packages needed
 * @param {string} content - Original content
 * @param {string} title - Original title
 * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr', 'de')
 * @returns {Promise<{title: string, content: string}>}
 */
export const translateContent = async (content, title, targetLanguage) => {
  try {
    // Translate title
    const titleEncoded = encodeURIComponent(title);
    const titleUrl = `https://api.mymemory.translated.net/get?q=${titleEncoded}&langpair=en|${targetLanguage}`;
    const titleResponse = await fetch(titleUrl);
    const titleData = await titleResponse.json();
    
    if (titleData.responseStatus !== 200) {
      throw new Error('Translation API error');
    }
    
    const translatedTitle = titleData.responseData.translatedText;
    
    // Translate content in chunks (MyMemory limit is 500 chars per request)
    const chunkSize = 450;
    const contentChunks = [];
    
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.substring(i, i + chunkSize);
      const chunkEncoded = encodeURIComponent(chunk);
      const contentUrl = `https://api.mymemory.translated.net/get?q=${chunkEncoded}&langpair=en|${targetLanguage}`;
      
      const response = await fetch(contentUrl);
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        contentChunks.push(data.responseData.translatedText);
      } else {
        contentChunks.push(chunk); // Keep original if translation fails
      }
      
      // Small delay to respect API limits (avoid overwhelming the service)
      if (i + chunkSize < content.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return {
      title: translatedTitle,
      content: contentChunks.join(''),
    };
  } catch (error) {
    console.error('Error translating content:', error);
    throw new Error('Failed to translate content. Please try again.');
  }
};

/**
 * Generate blog topic suggestions based on user interests
 * @param {string[]} interests - Array of user interests/tags
 * @returns {Promise<string[]>}
 */
export const generateTopicSuggestions = async (interests) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const suggestionPrompt = `Based on these interests: ${interests.join(', ')}, suggest 5 engaging blog post topics.

Return ONLY a JSON array of strings:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;

    const result = await model.generateContent(suggestionPrompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Unable to parse suggestions response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw new Error('Failed to generate suggestions. Please try again.');
  }
};

/**
 * Improve existing blog content using AI
 * @param {string} content - Original content
 * @returns {Promise<string>}
 */
export const improveContent = async (content) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const improvementPrompt = `Improve the following blog content by making it more engaging, fixing grammar, and enhancing readability while maintaining the original meaning:

${content}

Provide only the improved content.`;

    const result = await model.generateContent(improvementPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error improving content:', error);
    throw new Error('Failed to improve content. Please try again.');
  }
};
