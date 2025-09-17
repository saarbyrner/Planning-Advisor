const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Load JSON data
const athletesData = JSON.parse(fs.readFileSync('./src/data/athletes.json', 'utf8')).slice(0, 3); // First 3 for sample
const fixturesData = JSON.parse(fs.readFileSync('./src/data/games_matches.json', 'utf8')).slice(0, 3);
const performanceData = JSON.parse(fs.readFileSync('./src/data/training_sessions.json', 'utf8')).slice(0, 3);

async function seed() {
  // Seed athletes
  const { data: athletes, error: athleteError } = await supabase.from('athletes').insert(
    athletesData.map(athlete => ({
      name: `${athlete.firstname} ${athlete.lastname}`,
      team: athlete.squad_name,
      profile: { age: athlete.age, position: athlete.position, injury_history: athlete.injury_status || 'None' }
    }))
  ).select();
  if (athleteError) throw athleteError;
  console.log('Seeded athletes:', athletes);

  // Seed fixtures (link to first athlete for simplicity)
  const { error: fixtureError } = await supabase.from('fixtures').insert(
    fixturesData.map((fixture, index) => ({
      athlete_id: athletes[index % athletes.length].id, // Cycle through seeded athlete IDs
      date: new Date(fixture.date),
      opponent: fixture.away_team || fixture.home_team,
      type: fixture.match_type
    }))
  );
  if (fixtureError) throw fixtureError;
  console.log('Seeded fixtures');

  // Seed performance_data (link to athletes)
  const { error: perfError } = await supabase.from('performance_data').insert(
    performanceData.map((perf, index) => ({
      athlete_id: athletes[index % athletes.length].id,
      metrics: { endurance: perf.average_workload * 10 || 80, speed: perf.session_rpe * 10 || 85, recent_sessions: perf.duration / 30 || 3 }
    }))
  );
  if (perfError) throw perfError;
  console.log('Seeded performance data');
}

seed().catch(console.error);
