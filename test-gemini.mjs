import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyDt0scQdyzFN7aF4vn1ITyp8iQLXP-apgY');
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("hello");
    console.log("gemini-1.5-flash works:", result.response.text());
  } catch (e) {
    console.log("gemini-1.5-flash FAILED:", e.message);
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent("hello");
    console.log("gemini-1.5-flash-latest works:", result.response.text());
  } catch (e) {
    console.log("gemini-1.5-flash-latest FAILED:", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    // pro-vision requires images usually, but we can test if it exists
    console.log("gemini-pro-vision exists");
  } catch (e) {
    console.log("gemini-pro-vision FAILED:", e.message);
  }
}
run();
