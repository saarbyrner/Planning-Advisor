import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import squads from '../data/squads_teams.json';
import games from '../data/games_matches.json';

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

export async function generateTeamPlan(teamId, weeks = 5) {
  const team = squads.find(s => s.id === teamId);
  if (!team) return 'Team not found';

  const teamFixtures = games.filter(g => g.home_team === team.name || g.away_team === team.name);
  const prompt = `Generate a ${weeks}-week periodization plan for the soccer team "${team.name}" based on squad data ${JSON.stringify(team)}, upcoming fixtures ${JSON.stringify(teamFixtures)}, and principles like progressive overload, recovery, and team improvement.

Ensure the plan is realistic and populated: Include a timeline entry for EVERY day (e.g., ${weeks*7} entries for ${weeks} weeks starting from 2025-09-18), with varied colors (red for high intensity, yellow for medium, green for recovery/low) and labels reflecting soccer training focus. Explicitly incorporate fixtures: mark match days in the timeline with a special label like "Match Day" and color (e.g., blue or red), and adjust surrounding days for taper (low intensity before) and recovery (green after).

Generate EXACTLY one session per day (${weeks*7} sessions), each tied to its day with a matching date starting from 2025-09-18. For match days, use a simple session like {"name": "Match Day", "date": "...", "overall_load": "High", "principles": "Competition", "play_athletes": "Starting XI + Subs", "drills": [{"name": "Pre-Match Warm-up", "duration": 30, "load": "Medium", "staff": "Coach"}, /* 2-3 more match-related */]}. For non-match days, focus on soccer coach perspectives: technical/tactical drills for phases of play, addressing weaknesses, team improvement. Include sports science elements (e.g., load management, recovery) but avoid pure strength & conditioning sessions—integrate them into soccer-specific contexts if needed. Each session must have 3-5 drills. Adjust intensity based on fixtures (e.g., no high load day before a match).

IMPORTANT: Output ONLY valid JSON (no extra text) with this exact structure: 
{
  "timeline": [ /* FULL array of ${weeks*7} objects like { "day": 1, "color": "red", "label": "High Intensity Tactical Training" } */ ],
  "sessions": [ /* Exactly ${weeks*7} objects, one per day, like { "name": "Tactical Session", "date": "2025-09-18", "overall_load": "High", "principles": "Progressive overload", "play_athletes": "Full Squad", "drills": [ { "name": "Warm-up", "duration": 15, "load": "Low", "staff": "Coach A" }, /* 3-5 more */ ] } */ ]
}`;

  const { text } = await generateText({
    model: google('models/gemini-1.5-flash-latest'),
    prompt,
  });

  // Strip Markdown wrappers more robustly
  let cleanedText = text;
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    cleanedText = jsonMatch[1].trim();
  } else {
    cleanedText = text.replace(/```json|```/g, '').trim();
  }

  console.log('Raw AI output:', cleanedText); // Debug log

  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('AI parse error:', e, cleanedText);
    return { timeline: [], sessions: [], error: 'Failed to generate valid plan' };
  }
}
