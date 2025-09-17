import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export async function generatePlan(athlete, profile, fixtures, metrics) {
  console.log('VITE_GEMINI_API_KEY value:', import.meta.env.VITE_GEMINI_API_KEY);
  if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your-gemini-api-key-here') {
    return 'Please add your VITE_GEMINI_API_KEY to .env and restart the server to enable AI generation.';
  }

  const prompt = `Generate a detailed 7-day training plan for athlete ${athlete.name} based on their profile ${JSON.stringify(profile)}, upcoming fixtures ${JSON.stringify(fixtures)}, and performance metrics ${JSON.stringify(metrics)}. Include daily sessions, focus areas (e.g., strength, endurance), intensity levels, and injury prevention tips. Make it personalized and realistic for a sports team context.`;

  const { text } = await generateText({
    model: google('models/gemini-1.5-flash-latest'),
    prompt,
  });

  return text;
}
