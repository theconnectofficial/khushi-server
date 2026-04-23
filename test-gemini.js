import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Gemini API Key...');
console.log('API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'No');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAPI() {
  try {
    console.log('\n1. Testing with gemini-2.0-flash...');
    const model1 = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result1 = await model1.generateContent('Say hello in one word');
    const response1 = await result1.response;
    console.log('✅ SUCCESS with gemini-2.0-flash:', response1.text());
  } catch (error) {
    console.log('❌ FAILED with gemini-2.0-flash:');
    console.log('Error:', error.message);
    console.log('Status:', error.status);
    console.log('Details:', error.errorDetails);
  }

  try {
    console.log('\n2. Testing with gemini-1.5-flash...');
    const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result2 = await model2.generateContent('Say hello in one word');
    const response2 = await result2.response;
    console.log('✅ SUCCESS with gemini-1.5-flash:', response2.text());
  } catch (error) {
    console.log('❌ FAILED with gemini-1.5-flash:', error.message);
  }

  try {
    console.log('\n3. Testing with gemini-1.5-pro...');
    const model3 = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result3 = await model3.generateContent('Say hello in one word');
    const response3 = await result3.response;
    console.log('✅ SUCCESS with gemini-1.5-pro:', response3.text());
  } catch (error) {
    console.log('❌ FAILED with gemini-1.5-pro:', error.message);
  }
}

testAPI().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
