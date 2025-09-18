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

export async function saveTeamPlan(teamId, plan, title = null) {
  // Use provided title or extract metadata from the plan
  const finalTitle = title || (plan.summary ? 
    (plan.summary.split('.')[0].length > 50 ? 
      plan.summary.split('.')[0].substring(0, 50) + '...' : 
      plan.summary.split('.')[0]) : 
    'Training Plan');
  
  // Extract dates from plan metadata or sessions
  let startDate = plan.start_date || null;
  let endDate = plan.end_date || null;
  let durationDays = 0;
  
  if ((!startDate || !endDate) && plan.sessions && Array.isArray(plan.sessions)) {
    const dates = plan.sessions
      .map(session => session.date)
      .filter(date => date)
      .sort();
    
    if (dates.length > 0) {
      startDate = dates[0];
      endDate = dates[dates.length - 1];
    }
  }
  
  // Get duration from timeline
  if (plan.timeline && Array.isArray(plan.timeline)) {
    durationDays = plan.timeline.length;
  } else if (plan.sessions && Array.isArray(plan.sessions)) {
    durationDays = plan.sessions.length;
  }

  const { error } = await supabase.from('team_plans').insert({ 
    team_id: teamId, 
    plan: JSON.stringify(plan),
    title: finalTitle,
  start_date: startDate,
  end_date: endDate,
    duration_days: durationDays
  });
  if (error) throw error;
}

export async function getTeamPlans(teamId) {
  const { data, error } = await supabase.from('team_plans').select('plan').eq('team_id', teamId);
  if (error) {
    console.error('Supabase fetch error:', error);
    return [];
  }
  return data.map(item => {
    try {
      return typeof item.plan === 'string' ? JSON.parse(item.plan) : item.plan;
    } catch (parseError) {
      console.error('JSON parse error in getTeamPlans:', parseError, item.plan);
      return null; // Or fallback object {}
    }
  }).filter(plan => plan !== null); // Filter out invalid plans
}

export async function getAllTeamPlans() {
  const { data, error } = await supabase.from('team_plans').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase fetch error:', error);
    return [];
  }
  return data.map(item => {
    try {
      const parsedPlan = typeof item.plan === 'string' ? JSON.parse(item.plan) : item.plan;
      return {
        id: item.id,
        team_id: item.team_id,
        plan: parsedPlan,
        title: item.title,
        start_date: item.start_date,
        end_date: item.end_date,
        duration_days: item.duration_days,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    } catch (parseError) {
      console.error('JSON parse error in getAllTeamPlans:', parseError, item.plan);
      return null;
    }
  }).filter(plan => plan !== null);
}

export async function updateTeamPlanTitle(planId, title) {
  const { error } = await supabase.from('team_plans').update({ title }).eq('id', planId);
  if (error) throw error;
}

export async function deleteTeamPlan(planId) {
  const { error } = await supabase.from('team_plans').delete().eq('id', planId);
  if (error) throw error;
}

export async function getTeamFixtures(teamId) {
  const { data, error } = await supabase
    .from('team_fixtures')
    .select('*')
    .eq('team_id', teamId)
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data;
}
