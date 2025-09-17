import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAthletes() {
  const { data, error } = await supabase.from('athletes').select('*');
  if (error) throw error;
  return data;
}

export async function getFixtures(athleteId) {
  const { data, error } = await supabase.from('fixtures').select('*').eq('athlete_id', athleteId);
  if (error) throw error;
  return data;
}

export async function getPerformance(athleteId) {
  const { data, error } = await supabase.from('performance_data').select('*').eq('athlete_id', athleteId);
  if (error) throw error;
  return data;
}

export async function savePlan(athleteId, plan) {
  const { error } = await supabase.from('training_plans').insert({ athlete_id: athleteId, plan });
  if (error) throw error;
}
