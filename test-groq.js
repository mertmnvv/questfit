import fs from 'fs';
import path from 'path';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const testGroq = async () => {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
    });
    const data = await res.json();
    const models = data.data?.map(m => m.id);
    console.log('Available Models:', models);
  } catch (err) {
    console.error('Groq API Error:', err);
  }
};
testGroq();
