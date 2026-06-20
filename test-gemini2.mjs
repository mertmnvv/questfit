import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyDt0scQdyzFN7aF4vn1ITyp8iQLXP-apgY');
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent("hello");
    console.log("gemini-1.5-pro works:", result.response.text());
  } catch (e) {
    console.log("gemini-1.5-pro FAILED:", e.message);
  }
}
run();
