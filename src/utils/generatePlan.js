// Two-step training plan generation utilities
// 1. High-level team plan (timeline + session skeletons, no drills)
// 2. Per-session drill population (deterministic selection from enriched library)

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import squads from '../data/squads_teams.json';
import games from '../data/games_matches.json';
import enrichedDrills from '../data/drills_enriched.json';
import legacyDrills from '../data/drills.json';
import principlesData from '../data/principles_of_play.json';

// ---------------------- PERIODIZATION ENHANCEMENTS ----------------------
// New concepts added for more practitioner-realistic planning:
// 1. MD- / MD+ patterning around fixtures (Match Day minus X)
// 2. Weekly mesocycle phase tagging (Accumulation / Intensification / Taper / Transition)
// 3. Load classification separate from legacy color mapping (load_class)
// 4. Weekly load metrics (simple arbitrary load scores) + monotony & strain indicators
// 5. User overrides (UI can edit daily load classification and regenerate skeleton)
// -------------------------------------------------------------------------

// Mapping helpers
const LOAD_COLOR_MAP = {
  Match: 'purple',
  High: 'red',
  Medium: 'yellow',
  Low: 'green',
  Recovery: 'green',
  Off: 'grey'
};

const LOAD_LABEL_MAP = {
  Match: 'Match Day',
  High: 'High Intensity Training',
  Medium: 'Medium Load Training',
  Low: 'Low Load Training',
  Recovery: 'Recovery & Regeneration',
  Off: 'Rest / Off Feet'
};

// Mesocycle phases (simplistic default for up to 6 weeks)
function mesocyclePhase(weekIdx) {
  if (weekIdx <= 1) return 'Accumulation';
  if (weekIdx <= 3) return 'Intensification';
  if (weekIdx === 4) return 'Taper';
  if (weekIdx === 5) return 'Transition';
  return 'Maintenance';
}


function weekIndexFromDate(startDateStr, dateStr) {
  const s = new Date(startDateStr);
  const d = new Date(dateStr);
  return Math.floor((d - s)/86400000 / 7); // zero-based
}

// Compute weekly load metrics (arbitrary scoring): High=3, Medium=2, Low=1, Recovery=0.5, Off=0, Match=3.5
function computeWeeklyMetrics(timeline) {
  const scoreMap = { High:3, Medium:2, Low:1, Recovery:0.5, Off:0, Match:3.5 };
  const weeks = {};
  timeline.forEach(d => {
    const w = d.week_index || 0;
    if (!weeks[w]) weeks[w] = { week_index:w, days:[], total_load:0 };
    const score = scoreMap[d.load_class] ?? 1;
    weeks[w].days.push({ date:d.date, load_class:d.load_class, score });
    weeks[w].total_load += score;
  });
  // Monotony = mean / SD; Strain = total_load * monotony (Foster method approximation)
  Object.values(weeks).forEach(w => {
    const scores = w.days.map(x=>x.score);
    const mean = scores.reduce((a,b)=>a+b,0)/scores.length;
    const variance = scores.reduce((a,b)=> a + Math.pow(b-mean,2),0)/scores.length;
    const sd = Math.sqrt(variance) || 0.0001;
    const monotony = mean / sd;
    const strain = w.total_load * monotony;
    w.mean = mean; w.sd = sd; w.monotony = Number(monotony.toFixed(2)); w.strain = Number(strain.toFixed(2));
    w.flag_monotony = monotony > 2 ? 'High' : monotony > 1.5 ? 'Moderate' : 'OK';
    w.flag_strain = strain > 160 ? 'High' : strain > 120 ? 'Moderate' : 'OK';
  });
  return Object.values(weeks);
}

// AI-driven summary generator that creates intelligent periodization based on input parameters
async function generateSummary(team, fixturesInRange, durationDescriptor, timeline, userObjective='') {
  const model = getGoogleAI()('models/gemini-1.5-flash-latest');
  
  // Build context for AI analysis
  const totalMatches = fixturesInRange.length;
  const weeks = [...new Set(timeline.map(d=>d.week_index))].length;
  const highDays = timeline.filter(d=>d.load_class==='High').length;
  const mediumDays = timeline.filter(d=>d.load_class==='Medium').length;
  const lowRecovery = timeline.filter(d=>d.load_class==='Low' || d.load_class==='Recovery').length;
  const phases = [...new Set(timeline.map(d=> d.mesocycle_phase))];
  const firstDate = timeline[0]?.date;
  const lastDate = timeline[timeline.length-1]?.date;
  
  // Create fixtures context
  const fixturesContext = fixturesInRange.map(f => 
    `${f.date}: ${f.home_team} vs ${f.away_team} (${f.competition})`
  ).join(', ');

  const prompt = `You are an elite soccer periodization coach. Create a COMPLETELY UNIQUE and innovative periodization summary for this training plan.

TEAM: ${team.name}
DURATION: ${durationDescriptor} (${weeks} weeks from ${firstDate} to ${lastDate})
USER OBJECTIVE: ${userObjective || 'General team development'}

FIXTURES: ${fixturesContext || 'No matches scheduled'}

PERIODIZATION STRUCTURE:
- High intensity days: ${highDays}
- Medium intensity days: ${mediumDays}  
- Low/Recovery days: ${lowRecovery}
- Mesocycle phases: ${phases.join(', ')}

TIMELINE ANALYSIS:
${timeline.map(day => 
  `${day.date}: ${day.load_class} load, ${day.mesocycle_phase} phase${day.isFixture ? ` (MATCH: ${day.fixture?.opponent})` : ''}`
).join('\n')}

Create a periodization summary that is:
1. COMPLETELY UNIQUE and innovative
2. HIGHLY SPECIFIC to this team's objectives and approach
3. SHOWS ADVANCED PERIODIZATION EXPERTISE
4. EXPLAINS the unique training philosophy and approach
5. JUSTIFIES the load distribution with advanced reasoning
6. HIGHLIGHTS innovative training principles

IMPORTANT: Make this summary COMPLETELY DIFFERENT from standard periodization explanations. Be creative and show advanced coaching expertise.

Return JSON format:
{"summary": "Innovative and unique periodization explanation...", "principles": ["Unique Principle 1", "Unique Principle 2", "Unique Principle 3"]}

Focus on the user's specific objectives: ${userObjective}`;

  const { text } = await generateText({ 
    model, 
    prompt, 
    maxTokens: 4000,
    temperature: 0.9 // Higher creativity for more unique content
  });
  
  const parsed = JSON.parse(text);
  return {
    summary: parsed.summary || 'AI-generated periodization plan',
    principles: parsed.principles || []
  };
}

// Fallback basic summary generator
function generateBasicSummary(team, fixturesInRange, durationDescriptor, timeline, userObjective='') {
  const totalMatches = fixturesInRange.length;
  const weeks = [...new Set(timeline.map(d=>d.week_index))].length;
  const highDays = timeline.filter(d=>d.load_class==='High').length;
  const mediumDays = timeline.filter(d=>d.load_class==='Medium').length;
  const lowRecovery = timeline.filter(d=>d.load_class==='Low' || d.load_class==='Recovery').length;
  const phases = [...new Set(timeline.map(d=> d.mesocycle_phase))];
  const firstDate = timeline[0]?.date;
  const lastDate = timeline[timeline.length-1]?.date;
  const importanceAvg = (()=>{ const imps = timeline.filter(d=>d.isFixture).map(d=> d.fixture?.importance_weight||1); return imps.length? (imps.reduce((a,b)=>a+b,0)/imps.length).toFixed(2):'1.00'; })();

  const objectiveClause = userObjective ? ` Objective focus: ${userObjective}.` : '';
  const matchClause = totalMatches>0 ? `${totalMatches} match${totalMatches>1?'es':''}` : 'no matches';
  const phaseClause = phases.length ? `Phases traversed: ${phases.join(', ')}.` : '';

  const summary = `Generated a ${durationDescriptor} plan (${weeks} week span) from ${firstDate} to ${lastDate} featuring ${matchClause}. High-load days: ${highDays}, medium: ${mediumDays}, low/recovery: ${lowRecovery}. Avg match importance weighting ${importanceAvg}. ${phaseClause}${objectiveClause}`.replace(/\s+/g,' ').trim();

  // Extract principle emphasis heuristically from load distribution & MD labels
  const principlePool = principlesData.principles_of_play;
  function pick(cat, nameStarts){
    const list = principlePool[cat]||[];
    return list.find(p=> nameStarts.some(ns=> p.name.startsWith(ns)))?.name || (list[0]?.name);
  }
  const principles = [
    pick('attacking',['Penetration','Support']),
    pick('attacking',['Mobility','Width']),
    pick('defending',['Pressure','Compactness']),
    pick('transition',['Transition to Attack','Transition to Defend'])
  ].filter(Boolean);

  return { summary, principles };
}

// Determine focus principles (higher-level emphasis) either from user selection or heuristic based on load distribution.
function deriveFocusPrinciples(userSelected = []) {
  const pool = principlesData.principles_of_play;
  if (userSelected && userSelected.length) {
    // Return validated names only
    const flat = Object.values(pool).flat();
    return userSelected.filter(sel => flat.some(p => p.name === sel)).slice(0,6);
  }
  // Heuristic: pick 2 attacking, 2 defending, 2 transition if available
  function pick(cat, count){
    const arr = (pool[cat]||[]).slice(0,count).map(p=>p.name);
    return arr;
  }
  return [
    ...pick('attacking',2),
    ...pick('defending',2),
    ...pick('transition',2)
  ].filter(Boolean);
}

// Backward-compatible per-athlete plan (returns text) used by existing UI (App.jsx)
export async function generatePlan(athlete, profile, fixtures, metrics) {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return 'Please add your AI API key in settings or set VITE_GEMINI_API_KEY in .env to enable AI generation.';
  }
  const prompt = `Generate a detailed 7-day training plan for athlete ${athlete.name} based on their profile ${JSON.stringify(profile)}, upcoming fixtures ${JSON.stringify(fixtures)}, and performance metrics ${JSON.stringify(metrics)}. Include daily sessions, focus areas (e.g., strength, endurance), intensity levels, and injury prevention tips. Make it personalized and realistic for a sports team context.`;
  const { text } = await generateText({
    model: getGoogleAI()('models/gemini-1.5-flash-latest'),
    prompt,
    maxTokens: 6000
  });
  return text;
}

// Get API key from localStorage or environment variable
function getApiKey() {
  const customApiKey = localStorage.getItem('ai-api-key');
  return customApiKey || import.meta.env.VITE_GEMINI_API_KEY;
}

// Create Google AI instance dynamically
function getGoogleAI() {
  return createGoogleGenerativeAI({
    apiKey: getApiKey(),
  });
}

// Utility: format date offset from start
function formatDate(startDate, offsetDays) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// Build timeline using either weeks or explicit date range; includes fixture metadata
function buildTimeline(team, fixtures, { weeks, startDate, endDate }) {
  let dates = [];
  const start = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
  } else {
    const totalDays = weeks * 7;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
  }
  // Normalize fixture dates to YYYY-MM-DD keys to avoid mismatches (timezones / timestamps)
  const fixtureMap = new Map();
  fixtures.forEach(f => {
    if (!f) return;
    const raw = f.date;
    if (!raw) return;
    let key;
    try {
      key = new Date(raw).toISOString().split('T')[0];
    } catch {
      key = (raw + '').split('T')[0];
    }
    // Only set first occurrence for a date (ignore duplicates for now)
    if (key && !fixtureMap.has(key)) fixtureMap.set(key, f);
  });
  // Pre-compute basic relative importance for fixtures (simple heuristic: competition tier + stage keywords)
  const importanceScores = new Map();
  fixtures.forEach(f => {
    const comp = (f.competition || '').toLowerCase();
    let score = 1; // baseline league
    if (/semi|quarter|final/.test(comp)) score += 0.4;
    if (/cup|champions|playoff|knockout/.test(comp)) score += 0.3;
    if (/friendly|preseason/.test(comp)) score -= 0.3;
    if (/relegation|derby|rival/.test((f.notes||'').toLowerCase())) score += 0.2;
    if (score < 0.6) score = 0.6;
    importanceScores.set(f, Number(score.toFixed(2)));
  });
  let matchCounter = 0;

  const timeline = dates.map((d, idx) => {
    const iso = d.toISOString().split('T')[0];
    let fixture = fixtureMap.get(iso);
    // Fallback: try loose match if not found (e.g., original key had timezone causing off-by-one local shift)
    if (!fixture) {
      // Look for any fixture whose normalized date matches after constructing Date again (defensive)
      for (const [k,v] of fixtureMap.entries()) {
        if (k === iso) { fixture = v; break; }
      }
    }
    let color, label, isFixture=false;
    if (fixture) {
      color = 'purple';
      // Derive opponent robustly
      let opponent;
      const home = fixture.home_team || fixture.home || fixture.host || fixture.team_home;
      const away = fixture.away_team || fixture.away || fixture.opponent || fixture.team_away;
      const isHome = (home && home === team.name) || fixture.is_home === true;
      if (home && away) {
        opponent = isHome ? away : home;
      } else {
        // Fallback heuristics
        opponent = fixture.opponent || fixture.away_team || fixture.away || fixture.home_team || 'Opponent';
      }
      const competition = fixture.competition || fixture.comp || fixture.competition_name || '';
      const compShort = competition ? (competition.length > 18 ? competition.split(' ').map(w=>w[0]).join('').toUpperCase() : competition) : '';
      label = `Match vs ${opponent}${compShort ? ' ('+compShort+')':''}`;
      isFixture = true;
      matchCounter += 1;
      const importance_weight = importanceScores.get(fixture) || 1;
      fixture.__meta = { match_number: matchCounter, importance_weight };
    } else {
      // Leave training days unassigned - AI will determine the structure
      color = 'grey'; 
      label = 'Training Day (AI will determine load)';
    }
    return { day: idx + 1, date: iso, color, label, isFixture, fixture: fixture ? {
      opponent: (fixture.home_team||fixture.home) === team.name ? (fixture.away_team || fixture.away || fixture.opponent) : (fixture.home_team || fixture.home || fixture.opponent),
      home: (fixture.home_team||fixture.home) === team.name,
      importance_weight: fixture.__meta?.importance_weight || 1,
      match_number: fixture.__meta?.match_number || null,
      raw: fixture
    } : null };
  });
  return timeline;
}

// Apply periodization immediately after building raw timeline (public helper if needed elsewhere)
// AI-driven periodization that creates intelligent load distribution based on user parameters
async function assignPeriodizedLoads(timeline, userObjective = '', userSelectedPrinciples = []) {
  const model = getGoogleAI()('models/gemini-1.5-flash-latest');
  
  // Build context for AI periodization
  const fixtures = timeline.filter(d => d.isFixture);
  const fixturesContext = fixtures.map(f => 
    `${f.date}: vs ${f.fixture?.opponent} (${f.fixture?.competition || 'League'})`
  ).join(', ');

  const timelineContext = timeline.map((day, idx) => {
    const fixtureInfo = day.isFixture ? ` (MATCH vs ${day.fixture?.opponent})` : '';
    return `${idx + 1}. ${day.date}: ${day.isFixture ? 'MATCH DAY' : 'TRAINING DAY'}${fixtureInfo}`;
  }).join('\n');

  const prompt = `You are an elite soccer periodization coach. Create a COMPLETELY UNIQUE and innovative training periodization for this team.

TEAM OBJECTIVE: ${userObjective || 'General team development'}
FOCUS PRINCIPLES: ${userSelectedPrinciples.join(', ') || 'General development'}

FIXTURES IN PERIOD:
${fixturesContext || 'No matches scheduled'}

TIMELINE STRUCTURE:
${timelineContext}

Create a periodization that is:
1. COMPLETELY UNIQUE - avoid any standard patterns like MD-5/4/3/2/1
2. HIGHLY SPECIFIC to this team's objectives and focus principles
3. INNOVATIVE in load distribution approach
4. CONTEXTUAL to the specific fixtures and timeline
5. SHOWS ADVANCED PERIODIZATION EXPERTISE
6. BREAKS AWAY from traditional weekly patterns

For each day, assign the most appropriate load class and create unique periodization:
- High: High intensity training, technical/tactical focus
- Medium: Moderate intensity, skill development
- Low: Light training, recovery focus
- Recovery: Active recovery, regeneration
- Off: Complete rest

IMPORTANT: 
- Make this periodization COMPLETELY DIFFERENT from standard patterns
- Be creative and innovative - show advanced coaching expertise
- Consider the team's specific objectives and focus principles
- Create unique load distribution that reflects periodization science
- Avoid generic weekly patterns

Return JSON format:
{"load_distribution": [{"day_index": 0, "load_class": "High", "rationale": "Detailed explanation for this unique load choice", "md_label": "Custom label", "mesocycle_phase": "Accumulation"}]}

STRICT JSON ONLY.`;

  const { text } = await generateText({ 
    model, 
    prompt, 
    maxTokens: 4000,
    temperature: 0.9 // Higher creativity for more unique content
  });
  
  const parsed = JSON.parse(text);
  const loadDistribution = parsed.load_distribution || [];
  
  // Apply AI-generated load distribution to ENTIRE timeline
  loadDistribution.forEach(({ day_index, load_class, rationale, md_label, mesocycle_phase }) => {
    if (timeline[day_index]) {
      if (timeline[day_index].isFixture) {
        // Match days
        timeline[day_index].load_class = 'Match';
        timeline[day_index].color = LOAD_COLOR_MAP.Match;
        timeline[day_index].label = LOAD_LABEL_MAP.Match + (timeline[day_index].fixture ? ` vs ${timeline[day_index].fixture.opponent}` : '');
        timeline[day_index].md_label = 'MD';
      } else {
        // Training days - AI determines everything
        timeline[day_index].load_class = load_class;
        timeline[day_index].color = LOAD_COLOR_MAP[load_class];
        timeline[day_index].label = LOAD_LABEL_MAP[load_class];
        timeline[day_index].ai_rationale = rationale;
        timeline[day_index].md_label = md_label || null;
        timeline[day_index].mesocycle_phase = mesocycle_phase || 'General';
      }
    }
  });
  
  // Add week indices and mesocycle phases
  timeline.forEach((day, idx) => {
    const weekIndex = Math.floor(idx / 7);
    day.week_index = weekIndex;
    if (!day.mesocycle_phase) {
      day.mesocycle_phase = mesocyclePhase(weekIndex);
    }
  });
}

// Fallback deterministic periodization (original logic)
function assignPeriodizedLoadsDeterministic(timeline) {
  // Collect fixture indices sorted
  const fixtureIdxs = timeline.map((d,i)=> d.isFixture ? i : -1).filter(i=> i>=0).sort((a,b)=>a-b);
  function nextFixture(idx){ return fixtureIdxs.find(f=> f>idx); }
  function currentOrPrevFixture(idx){ let r; for (const f of fixtureIdxs){ if (f<=idx) r=f; else break; } return r; }

  // Calendar weekday fallback pattern (if no surrounding fixture): Mon High, Tue Medium, Wed High, Thu Medium, Fri Low, Sat Low/Activation, Sun Recovery
  function weekdayFallback(dateStr){
    const d = new Date(dateStr).getUTCDay(); // 0 Sun .. 6 Sat
    switch(d){
      case 1: return 'High'; // Mon
      case 2: return 'Medium'; // Tue
      case 3: return 'High'; // Wed
      case 4: return 'Medium'; // Thu
      case 5: return 'Low'; // Fri
      case 6: return 'Low'; // Sat
      case 0: return 'Recovery'; // Sun
      default: return 'Medium';
    }
  }

  timeline.forEach((day, idx) => {
    if (day.isFixture){
      day.load_class='Match';
      day.color=LOAD_COLOR_MAP.Match;
      day.label = LOAD_LABEL_MAP.Match + (day.fixture? ` vs ${day.fixture.opponent}`:'');
      day.md_label='MD';
      return;
    }
    const prevFix = currentOrPrevFixture(idx);
    const nextFix = nextFixture(idx);
    let mdLabel = null;
    if (typeof nextFix === 'number'){
      const until = nextFix - idx; if (until>=1 && until<=6) mdLabel = 'MD-'+until;
    }
    if (!mdLabel && typeof prevFix === 'number'){
      const after = idx - prevFix; if (after>=1 && after<=3) mdLabel = 'MD+'+after; // extend to +3 for medium reload
    }
    let loadClass;
    // Updated MD template (common pro week): MD-5 High, MD-4 High, MD-3 Medium, MD-2 Medium (tactical), MD-1 Low/Recovery.
    // Importance-aware taper: if upcoming match importance_weight > 1.15, make MD-2 Low and MD-1 Recovery.
    const upcomingImportance = (typeof nextFix==='number' && timeline[nextFix]?.fixture?.importance_weight) || 1;
    switch(mdLabel){
      case 'MD-6': loadClass='High'; break;
      case 'MD-5': loadClass='High'; break;
      case 'MD-4': loadClass='High'; break;
      case 'MD-3': loadClass='Medium'; break;
      case 'MD-2': loadClass= upcomingImportance>1.15 ? 'Low':'Medium'; break;
      case 'MD-1': loadClass= upcomingImportance>1.15 ? 'Recovery':'Low'; break;
      case 'MD+1': loadClass='Recovery'; break;
      case 'MD+2': loadClass='Low'; break;
      case 'MD+3': loadClass='Medium'; break;
    }
    // Handle fixture congestion (two matches <=72h apart): compress pattern High removed, emphasize Recovery + Medium only.
    if (typeof prevFix==='number' && typeof nextFix==='number' && (nextFix - prevFix) <= 3){
      if (!day.isFixture){
        if (idx === prevFix+1) loadClass='Recovery';
        else if (idx === nextFix-1) loadClass='Low';
        else loadClass='Medium';
      }
    }
    if (!loadClass){
      loadClass = weekdayFallback(day.date);
    }

    day.load_class = loadClass;
    day.color = LOAD_COLOR_MAP[loadClass] || day.color;
    if (day.fixture?.match_number) {
      // Ensure match days keep match label; training days adapt to load
      if (loadClass !== 'Match') day.label = LOAD_LABEL_MAP[loadClass];
    } else {
      day.label = LOAD_LABEL_MAP[loadClass];
    }
    day.md_label = mdLabel;
  });

  timeline.forEach(d => {
    const w = weekIndexFromDate(timeline[0].date, d.date);
    d.week_index = w;
    d.mesocycle_phase = mesocyclePhase(w);
  });
  return timeline;
}
// Re-introduced after refactor: map session load to applied principles.
function mapSessionPrinciples(loadLabel, isFixture) {
  const p = principlesData.principles_of_play;
  function find(cat, name) { return p[cat].find(x => x.name.startsWith(name))?.name || name; }
  if (isFixture) {
    return [
      find('attacking','Penetration'),
      find('attacking','Support'),
      find('transition','Transition to Attack'),
      find('transition','Transition to Defend'),
      find('defending','Pressure'),
      find('defending','Compactness')
    ];
  }
  if (loadLabel === 'High') {
    return [
      find('attacking','Penetration'),
      find('attacking','Mobility'),
      find('defending','Pressure'),
      find('defending','Cover'),
      find('transition','Transition to Attack (Positive Transition)')
    ];
  }
  if (loadLabel === 'Medium') {
    return [
      find('attacking','Support'),
      find('attacking','Width'),
      find('defending','Balance'),
      find('defending','Compactness'),
      find('transition','Transition to Defend (Negative Transition)')
    ];
  }
  // Low / Recovery
  return [
    find('defending','Control/Restraint'),
    find('defending','Compactness'),
    find('attacking','Support'),
    find('transition','Transition to Defend (Negative Transition)')
  ];
}

function deriveSessionSkeleton(dayMeta) {
  if (dayMeta.isFixture) {
    return {
      name: 'Match Day + Activation',
      date: dayMeta.date,
      overall_load: 'Match',
      principles: 'Compete; Execute tactical plan; Efficient warm-up',
      principles_applied: mapSessionPrinciples('Match', true),
      play_athletes: 'Starting XI + Bench',
      phases: [
        { name: 'Activation', focus: 'Dynamic mobility & neural priming', target_intensity: 'Low', planned: true, phase_type: 'warm' },
        { name: 'Pre-Match Tactical Review', focus: 'Set pieces & final cues', target_intensity: 'Low', planned: true, phase_type: 'tactical' },
        { name: 'Cool Down', focus: 'Recovery & down-regulation', target_intensity: 'Low', planned: true, phase_type: 'cool' }
      ],
      drills_generated: false
    };
  }
  // Prefer explicit periodized load_class if present
  let loadLabel = dayMeta.load_class || (dayMeta.color === 'red' ? 'High' : dayMeta.color === 'yellow' ? 'Medium' : 'Low');
  if (loadLabel === 'Recovery') loadLabel = 'Low'; // Map recovery to low for skeleton differentiation (phases still lighter)
  // Dynamic phase templates: always warm & cool; variable number of core blocks (Technical/Tactical/Transition blend)
  const coreBlocks = [];
  if (loadLabel === 'High') {
    coreBlocks.push({ name: 'Technical', focus: 'High tempo ball circulation', target_intensity: 'Medium', phase_type: 'technical' });
    coreBlocks.push({ name: 'Tactical', focus: 'Pressing & transition triggers', target_intensity: loadLabel, phase_type: 'tactical' });
    // ~50% chance of an extra technical refinement or small-sided transition emphasis
    if (Math.random() < 0.5) {
      coreBlocks.push({ name: 'Technical Extension', focus: 'Small-sided speed of play', target_intensity: 'Medium', phase_type: 'technical' });
    } else {
      coreBlocks.push({ name: 'Transition Game', focus: 'Rapid positive/negative transitions', target_intensity: 'High', phase_type: 'transition' });
    }
  } else if (loadLabel === 'Medium') {
    coreBlocks.push({ name: 'Technical', focus: 'Refinement & receiving quality', target_intensity: 'Low', phase_type: 'technical' });
    coreBlocks.push({ name: 'Tactical', focus: 'Positional play patterns', target_intensity: loadLabel, phase_type: 'tactical' });
    // 40% chance of an auxiliary block
    if (Math.random() < 0.4) {
      coreBlocks.push({ name: 'Applied Technical', focus: 'Pattern to goal / finishing', target_intensity: 'Medium', phase_type: 'technical' });
    }
  } else { // Low
    coreBlocks.push({ name: 'Technical', focus: 'Light technical maintenance', target_intensity: 'Low', phase_type: 'technical' });
    if (Math.random() < 0.3) {
      coreBlocks.push({ name: 'Tactical Walkthrough', focus: 'Structural rehearsal / shape', target_intensity: 'Low', phase_type: 'tactical' });
    }
  }
  const phases = [
    { name: 'Warm Up', focus: 'Movement prep & ball activation', target_intensity: 'Low', phase_type: 'warm' },
    ...coreBlocks,
    { name: 'Cool Down', focus: 'Flexibility & recovery', target_intensity: 'Low', phase_type: 'cool' }
  ];
  return {
    name: loadLabel + ' Load Training Day',
    date: dayMeta.date,
    overall_load: loadLabel,
    principles: loadLabel === 'High' ? 'Progressive overload; Tactical intensity; Quality execution' : loadLabel === 'Medium' ? 'Maintain sharpness; Technical consistency; Tactical cohesion' : 'Recovery; Movement quality; Mental freshness',
    principles_applied: mapSessionPrinciples(loadLabel, false),
    play_athletes: 'Full Squad',
    phases: phases.map(p => ({ ...p, planned: true })),
    drills_generated: false
  };
}

// High-level plan only (skeletons without drills)
export async function generateHighLevelTeamPlan(teamId, weeksOrOptions = 5) {
  let options = {};
  if (typeof weeksOrOptions === 'object') options = { ...weeksOrOptions }; else options.weeks = weeksOrOptions;
  if (!options.startDate) options.startDate = new Date().toISOString().split('T')[0];
  if (!options.weeks && !options.endDate) options.weeks = 5;
  if (options.weeks && options.weeks > 6) options.weeks = 6;
  if (options.endDate) {
    const s = new Date(options.startDate); const e = new Date(options.endDate);
    const diff = Math.round((e - s)/86400000) + 1; if (diff > 42) { e.setDate(s.getDate()+41); options.endDate = e.toISOString().split('T')[0]; }
  }
  const team = squads.find(s => s.id === teamId); if (!team) return 'Team not found';
  
  // Use fixtures from options if provided (from Supabase), otherwise fallback to static data
  let teamFixtures;
  if (options.fixtures && Array.isArray(options.fixtures)) {
    // Convert Supabase fixtures ensuring normalized date
    teamFixtures = options.fixtures.map(f => ({
      date: (()=>{ try { return new Date(f.date).toISOString().split('T')[0]; } catch { return (f.date||'').split('T')[0]; } })(),
      home_team: f.home_team || team.name,
      away_team: f.away_team || f.opponent,
      competition: f.competition || 'League'
    }));
  } else {
    // Fallback to static data
    teamFixtures = games.filter(g => g.home_team === team.name || g.away_team === team.name);
  }
  
  const endLimit = options.endDate || formatDate(options.startDate, (options.weeks || 1) * 7);
  const fixturesInRange = teamFixtures.filter(f => f.date >= options.startDate && f.date <= endLimit);
  const timeline = buildTimeline(team, fixturesInRange, options);
  // Apply AI-driven periodization layer based on user parameters
  await assignPeriodizedLoads(timeline, options.objective, options.userSelectedPrinciples);
  const weekly_metrics = computeWeeklyMetrics(timeline);
  const durationDescriptor = options.endDate ? (timeline.length + '-day') : (options.weeks + '-week');
  let meta;
  try {
    meta = await generateSummary(team, fixturesInRange, durationDescriptor, timeline, options.objective);
  } catch (e) {
    meta = { summary: 'Summary generation failed (fallback).', principles: [] };
  }
  let focus_principles = [];
  try { focus_principles = deriveFocusPrinciples(options.userSelectedPrinciples); } catch { focus_principles = []; }
  const matches = timeline.filter(d=> d.isFixture).map(d => ({
    date: d.date,
    opponent: d.fixture?.opponent,
    home: d.fixture?.home,
    match_number: d.fixture?.match_number,
    importance_weight: d.fixture?.importance_weight,
    competition: d.fixture?.raw?.competition || d.fixture?.raw?.competition_name || '',
  }));
  return {
    summary: meta.summary,
    principles: meta.principles,
    principles_of_play: principlesData.principles_of_play,
    focus_principles,
    timeline,
    sessions: timeline.map(deriveSessionSkeleton),
    matches,
    generated_at: new Date().toISOString(),
    team: team.name,
    weeks: options.weeks || null,
    start_date: options.startDate,
    end_date: options.endDate || null,
    total_days: timeline.length,
    weekly_metrics,
    warnings: weekly_metrics.some(w=> w.flag_monotony==='High') ? ['High weekly monotony detected – consider inserting an additional variation / recovery day.'] : [],
    settings: {
      variability: options.variability || 'medium',
      objective: options.objective || '',
      selectedPrinciples: options.userSelectedPrinciples || [],
      generationMode: options.generationMode || 'curated' // curated | hybrid | generative
    }
  };
}

// Generate drills for a specific session index given a high-level plan (idempotent replacement of phases with drills arrays)
export async function generateSessionDrills(plan, sessionIndex, { useModelRefinement = true } = {}) {
  const team = squads.find(s => s.name === plan.team) || squads.find(s => s.id === plan.team_id);
  if (!team) throw new Error('Team not found for drill generation');
  const session = plan.sessions[sessionIndex];
  if (!session) throw new Error('Session index out of range');
  if (session.drills_generated) return session; // already populated
  const dayMeta = plan.timeline[sessionIndex];
  // Ensure phases structure exists
  if (!Array.isArray(session.phases)) session.phases = [];
  const originalPhases = session.phases.map(p => ({ ...p }));

  // Build historical usage & principle coverage BEFORE selecting new drills
  const PRIOR_WINDOW = 3; // look back this many previous generated sessions for recent uniqueness penalty
  const previousSessions = plan.sessions.slice(0, sessionIndex).filter(s => s && s.drills_generated);
  const recentSessions = previousSessions.slice(-PRIOR_WINDOW);
  const recentDrillIds = new Set();
  const usageFreq = new Map();
  recentSessions.forEach(s => s.phases?.forEach(ph => ph.drills?.forEach(d => { if (d.id){ recentDrillIds.add(d.id); } })));
  previousSessions.forEach(s => s.phases?.forEach(ph => ph.drills?.forEach(d => { if (d.id){ usageFreq.set(d.id, (usageFreq.get(d.id)||0)+1); } })));
  // Principle coverage counts (focus only) to detect gaps
  const focusSetsAll = plan.focus_principles || {};
  const focusPrinciplesFlat = Object.values(focusSetsAll).flat();
  const principleCounts = new Map(focusPrinciplesFlat.map(p => [p,0]));
  previousSessions.forEach(s => s.phases?.forEach(ph => ph.principles_applied?.forEach(pr => { if (principleCounts.has(pr)) principleCounts.set(pr, principleCounts.get(pr)+1); })));
  const uncoveredPrinciples = new Set(Array.from(principleCounts.entries()).filter(([_,c]) => c===0).map(([p])=>p));
  const lowCoveragePrinciples = new Set(Array.from(principleCounts.entries()).filter(([_,c]) => c>0 && c<2).map(([p])=>p));

  // Track per-session picks to avoid duplication within session
  const pickedThisSession = new Set();

  function variabilityToNumeric(v) {
    if (v === 'low') return 0.35; if (v === 'high') return 0.85; return 0.6;
  }
  const planVariability = variabilityToNumeric(plan?.settings?.variability);

  // GLOBAL (plan-level) memory of drills used to broaden variety across all sessions.
  if (!plan.__global_drill_usage) {
    plan.__global_drill_usage = { countById: {}, chronological: [] };
  }
  const globalUsage = plan.__global_drill_usage;

  // Tag rotation cursor (rotates priority tags each session to force exposure of different categories)
  const ROTATION_TAGS = ['pressing','transition','passing','receiving','mobility','recovery','finishing','possession'];
  const rotationTag = ROTATION_TAGS[ sessionIndex % ROTATION_TAGS.length ];

  /**
   * Drill Selection Algorithm (Variety-Oriented)
   * -------------------------------------------------
   * Goals:
   *  - Increase distinct drills across the plan (avoid only 2-3 recurring).
   *  - Respect phase type & target workload alignment.
   *  - Prioritize uncovered / low-coverage focus principles.
   *  - Rotate emphasis tags session-by-session (ROTATION_TAGS) to force themed diversity.
   *  - Penalize: recent usage (last 3 sessions), overall frequency (global plan memory), within-session duplicates.
   *  - Fallback: if enriched library for a phase is small, synthesize candidates from legacy `drills.json`.
   *  - Stochastic sampling (weighted) instead of strict top-N to avoid deterministic repetition.
   *  - Guarantee at least one drill when any candidates exist.
   *  - All scoring transparent & easily tunable (see weights & penalties below).
   */

  function pickDrillsForPhase(phaseName, targetLoad, maxDrills) {
    if (maxDrills <= 0) return [];
    const phaseKey = phaseName.toLowerCase();
    const focusSets = plan.focus_principles || {};
    const flatFocus = Object.values(focusSets).flat();
    // Pre-filter candidates by phase (enriched)
    let candidatesRaw = enrichedDrills.filter(d => d.phase && d.phase.toLowerCase() === phaseKey);
    // Fallback enrich with synthetic wrapping of legacy drills if pool too small (<4)
    if (candidatesRaw.length < 4) {
      const legacyPhase = legacyDrills.filter(ld => {
        const name = (ld.name||'').toLowerCase();
        if (/warm/.test(phaseKey)) return /warm/.test(name) || /rondo/.test(name);
        if (/cool/.test(phaseKey)) return /stretch|cool/.test(name);
        if (/technical/.test(phaseKey)) return /pass|possession|shoot|cross/.test(name);
        if (/tactic|transition/.test(phaseKey)) return /press|transition|shape/.test(name);
        return true;
      }).map((ld,i) => ({
        id: 'legacy_'+phaseKey+'_'+i+'_'+ld.name.replace(/\s+/g,'_').toLowerCase(),
        name: ld.name,
        phase: phaseName,
        category: [phaseKey],
        objective_primary: ld.instructions,
        objectives_secondary: (ld.goals? ld.goals.split(/;|,/).map(s=>s.trim()) : []),
        duration_min: ld.duration-3>0? ld.duration-3: Math.max(5, Math.round(ld.duration*0.6)),
        duration_max: ld.duration,
        workload: ld.load || targetLoad,
        equipment: ld.equipment ? ld.equipment.split(',').map(s=>s.trim()) : [],
        media: { image_urls: [], alt_text: ld.visual },
        source: { name: 'legacy', quality_weight: 0.4 },
        coaching_points: [],
        constraints: [],
        progressions: [],
        regressions: [],
        players: {},
        space: {},
        last_reviewed: null
      }));
      candidatesRaw = [...candidatesRaw, ...legacyPhase];
    }
    const scored = candidatesRaw.map(d => {
      // Base quality & workload alignment
      const wlDistance = d.workload === targetLoad ? 0 : 1;
      const quality = d.source?.quality_weight || 0.5;
      const recency = d.last_reviewed ? (new Date(d.last_reviewed).getTime() / 1e12) : 0; // scaled
      // Principle relevance boost
      const textFields = [(d.objective_primary||''), ...(d.objectives_secondary||[]), ...(d.category||[])].map(x => x.toLowerCase());
      let principleBoost = 0;
      flatFocus.forEach(pr => {
        const token = pr.toLowerCase().split(' ')[0];
        if (textFields.some(t => t.includes(token))) {
          // Larger boost if this focus principle is currently uncovered
            if (uncoveredPrinciples.has(pr)) principleBoost += 0.35;
            else if (lowCoveragePrinciples.has(pr)) principleBoost += 0.22;
            else principleBoost += 0.12;
        }
      });
      // Rotation tag bonus (to ensure each session emphasises a different thematic bucket)
      if (d.tags?.includes(rotationTag) || d.category?.includes(rotationTag)) principleBoost += 0.18;
      // Uniqueness penalties
      const recentPenalty = recentDrillIds.has(d.id) ? 0.25 : 0;
      const freqPenalty = usageFreq.has(d.id) ? Math.min(0.15 * usageFreq.get(d.id), 0.45) : 0;
      const globalPenalty = globalUsage.countById[d.id] ? Math.min(0.07 * globalUsage.countById[d.id], 0.42) : 0;
      const withinSessionPenalty = pickedThisSession.has(d.id) ? 0.5 : 0; // strong penalty if somehow still present
      const score = quality - wlDistance * 0.18 + recency + principleBoost - recentPenalty - freqPenalty - withinSessionPenalty - globalPenalty;
      return { drill: d, score };
    })
    .sort((a,b) => b.score - a.score);

    // Introduce variability / stochastic sampling instead of strict top-N.
    const poolSize = Math.min(scored.length, Math.max(maxDrills * 3, 12));
    const pool = scored.slice(0, poolSize);
    // Convert scores to positive weights
    const minScore = pool.reduce((m,o)=> o.score < m ? o.score : m, pool[0]?.score || 0);
    let weights = pool.map(o => (o.score - minScore) + 0.01);
    // Temperature-like adjustment: high variability -> flatter distribution.
    const exponent = 1 - planVariability + 0.4; // low variability => larger exponent => peakier
    weights = weights.map(w => Math.max(1e-6, Math.pow(w, exponent)));
    function sampleOne() {
      const total = weights.reduce((a,b)=>a+b,0);
      if (total <= 0) return null;
      let r = Math.random() * total;
      for (let i=0;i<pool.length;i++) {
        if (!weights[i]) continue;
        if (r < weights[i]) return i;
        r -= weights[i];
      }
      return null;
    }
    const chosen = [];
    while (chosen.length < maxDrills && pool.length) {
      const idx = sampleOne();
      if (idx == null) break;
      const cand = pool[idx].drill;
      // Avoid duplicates or recently used heavy penalty; if duplicate skip by zeroing weight
      if (pickedThisSession.has(cand.id)) { weights[idx] = 0; continue; }
      chosen.push(cand);
      pickedThisSession.add(cand.id);
      globalUsage.countById[cand.id] = (globalUsage.countById[cand.id]||0) + 1;
      globalUsage.chronological.push(cand.id);
      weights[idx] = 0; // remove from future sampling
    }
    // Guarantee at least 1 drill if pool had any candidates
    if (chosen.length === 0 && scored.length) {
      const fallback = scored[0].drill;
      chosen.push(fallback);
      pickedThisSession.add(fallback.id);
      globalUsage.countById[fallback.id] = (globalUsage.countById[fallback.id]||0) + 1;
      globalUsage.chronological.push(fallback.id);
    }
    return chosen.map(drill => ({
      id: drill.id,
      name: drill.name,
      duration: Math.round((drill.duration_min + drill.duration_max)/2),
      load: drill.workload,
      staff: drill.category?.includes('tactical') ? 'Tactical Coach' : drill.category?.includes('recovery') ? 'Physio' : 'Coach',
      instructions: drill.objective_primary,
      goals: drill.objectives_secondary?.join('; '),
      equipment: drill.equipment?.join(', '),
      visual: drill.media?.image_urls?.[0] || drill.media?.alt_text,
      media: drill.media,
      source: drill.source,
      coaching_points: drill.coaching_points,
      constraints: drill.constraints,
      progressions: drill.progressions,
      regressions: drill.regressions,
      players: drill.players,
      space: drill.space,
      raw: drill
    }));
  }

  /**
   * Generative drill creation (model-based) when generationMode is 'generative' or 'hybrid'.
   * For 'hybrid' we only invoke model for phases that received 0 curated drills.
   */
  async function generateDrillsViaModel(phasesForGen, basePhasesMeta) {
    const model = getGoogleAI()('models/gemini-1.5-flash-latest');
    const sessionLoad = session.overall_load;
    const principlesList = (session.principles_applied || []).join('; ');
    const phaseDescriptor = phasesForGen.map(p => ({ name: p.name, target_intensity: p.target_intensity||p.intensity||'Medium'}));
    const prompt = `You are an elite soccer periodization coach. Create COMPLETELY UNIQUE and innovative drills for this specific session.

SESSION CONTEXT:
- Date: ${session.date}
- Overall Load: ${sessionLoad}
- Mesocycle Phase: ${dayMeta?.mesocycle_phase || 'Unknown'}
- Week Index: ${dayMeta?.week_index || 'Unknown'}
- Match Day: ${dayMeta?.isFixture ? `YES - Match vs ${dayMeta.fixture?.opponent}` : 'NO'}

TRAINING PRINCIPLES TO FOCUS ON:
${principlesList || 'General team development'}

PHASES TO CREATE DRILLS FOR:
${phaseDescriptor.map(p=>`- ${p.name} (Target: ${p.target_intensity} intensity)`).join('\n')}

PERIODIZATION INTELLIGENCE:
- This is a ${sessionLoad} load session in the ${dayMeta?.mesocycle_phase || 'general'} phase
- ${dayMeta?.isFixture ? 'This session must prepare for/reflect on the match' : 'This is a training day with no match'}
- Consider the week's progression and overall periodization goals
- Align drill complexity and intensity with the mesocycle phase

Create drills that are:
1. COMPLETELY UNIQUE and innovative
2. HIGHLY SPECIFIC to this session's load and phase
3. DIRECTLY support the training principles listed above
4. Show ADVANCED PERIODIZATION INTELLIGENCE
5. Are PROGRESSIVE and CONTEXTUAL to the team's development phase
6. Consider match preparation/recovery if applicable

IMPORTANT: Make these drills COMPLETELY DIFFERENT from standard drills. Be creative and innovative. Show advanced coaching expertise.

Return STRICT JSON only in this schema:
{"phases":[{"phase":"Phase Name","drills":[{"name":"Unique Drill Name","duration":10,"load":"Low|Medium|High","objective_primary":"Unique primary objective","objectives_secondary":["Unique Secondary A","Unique Secondary B"],"equipment":["Balls","Cones"],"coaching_points":["Unique coaching point 1"],"constraints":["Unique Rule"],"progressions":["Unique Progression"],"regressions":["Unique Regression"],"players":{"arrangement":"Unique Shape or numbers"},"space":{"dimensions":"Unique Area dimensions"}}]}]}

Guidelines:
- 1–3 drills per phase depending on intensity (High up to 3, Low often 1-2)
- Duration sum per phase should not exceed 35 minutes and be realistic vs intensity
- Make drill names and objectives COMPLETELY UNIQUE and innovative
- Show advanced coaching expertise and periodization knowledge
- If a phase is Cool Down include recovery / down regulation focus
- Consider the match context if this is a match day

STRICT JSON ONLY.`;
    try {
      const { text } = await generateText({ model, prompt, maxTokens: 1400 });
      const cleaned = text.trim().replace(/^```json/i,'').replace(/```$/,'');
      const parsed = JSON.parse(cleaned);
      if (!parsed || !Array.isArray(parsed.phases)) return {};
      const result = {};
      parsed.phases.forEach(ph => {
        if (!ph || !ph.phase || !Array.isArray(ph.drills)) return;
        const safeDrills = ph.drills.slice(0,4).map((d,i)=>({
          id: 'gen_'+sessionIndex+'_'+ph.phase.replace(/\s+/g,'_').toLowerCase()+'_'+i,
          name: (d.name||'Unnamed Drill').trim().slice(0,80),
          duration: Number.isFinite(d.duration)? Math.max(4, Math.min(40, Math.round(d.duration))) : 10,
          load: ['Low','Medium','High'].includes(d.load)? d.load : inferLoadFromPhase(ph.phase, sessionLoad),
          staff: 'Coach',
          instructions: d.objective_primary || d.description || 'Execute with quality and intensity.',
            goals: Array.isArray(d.objectives_secondary)? d.objectives_secondary.join('; '):'',
          equipment: Array.isArray(d.equipment)? d.equipment.join(', ') : (typeof d.equipment==='string'? d.equipment:''),
          visual: d.space?.dimensions || '',
          media: {},
          source: { name: 'ai-generated', quality_weight: 0.5 },
          coaching_points: d.coaching_points || [],
          constraints: d.constraints || [],
          progressions: d.progressions || [],
          regressions: d.regressions || [],
          players: d.players || {},
          space: d.space || {},
          raw: d
        }));
        result[ph.phase] = safeDrills;
      });
      return result;
    } catch (e) {
      console.warn('Generative drill JSON parse failed', e);
      return {};
    }
  }

  function inferLoadFromPhase(phase, sessionLoad) {
    if (/warm/i.test(phase) || /cool/i.test(phase)) return 'Low';
    if (/transition/i.test(phase)) return sessionLoad === 'High' ? 'High' : 'Medium';
    if (/tactic/i.test(phase)) return sessionLoad === 'High' ? 'High' : 'Medium';
    if (/technic/i.test(phase)) return sessionLoad === 'High' ? 'Medium' : sessionLoad;
    return sessionLoad || 'Medium';
  }

  const load = session.overall_load;
  // Determine dynamic desired drill counts based on phase types & session load
  // Total cap: High=6, Medium=5, Low=4 (excluding match days which are fixed)
  const sessionCap = load === 'High' ? 6 : load === 'Medium' ? 5 : 4;
  const skeletonPhases = originalPhases.filter(p => ['warm','technical','tactical','transition','cool'].includes((p.phase_type||'').toLowerCase()) || ['Warm Up','Cool Down'].includes(p.name));
  // Identify phases
  const warmPhase = skeletonPhases.find(p => (p.phase_type==='warm') || p.name==='Warm Up');
  const coolPhase = skeletonPhases.find(p => (p.phase_type==='cool') || p.name==='Cool Down');
  const corePhases = skeletonPhases.filter(p => ![warmPhase?.name, coolPhase?.name].includes(p.name));
  // Start with mandatory 1 warm & 1 cool drill (if phases exist)
  let remaining = sessionCap;
  const warm = warmPhase ? pickDrillsForPhase(warmPhase.name, 'Low', 1) : [];
  remaining -= warm.length;
  const cool = coolPhase ? pickDrillsForPhase(coolPhase.name, 'Low', 1) : [];
  remaining -= cool.length;
  // Allocate remaining across core phases respecting their type & principles weighting
  // Weight: technical phases favored when more attacking focus principles; tactical favored by defending; transition by transition focus
  const focusSets = plan.focus_principles || {};
  const attCount = (focusSets.attacking||[]).length;
  const defCount = (focusSets.defending||[]).length;
  const transCount = (focusSets.transition||[]).length;
  const weights = corePhases.map(p => {
    const t = (p.phase_type||'').toLowerCase();
    const w = t === 'technical' ? (1 + attCount*0.4) : t === 'tactical' ? (1 + defCount*0.35) : t === 'transition' ? (1 + transCount*0.6) : 1;
    return { phase: p, weight: w };
  });
  const weightSum = weights.reduce((a,b)=>a+b.weight,0) || 1;
  const allocation = weights
    .filter(wObj => !!wObj.phase)
    .map(wObj => ({ phase: wObj.phase, drills: Math.max(0, Math.round((wObj.weight/weightSum)*remaining)) }));
  
  // Safety check: if no core phases, skip allocation logic
  if (allocation.length === 0) {
    console.warn('No core phases found for drill allocation');
  }
  // Adjust to exactly remaining via greedy correction
  let allocated = allocation.reduce((a,b)=>a + (b?.drills||0),0);
  while (allocated > remaining) { // remove extras
    const over = allocation.find(a => a && a.drills>0);
    if (!over) break; over.drills--; allocated--;
  }
  while (allocated < remaining) { // add where benefit highest
    const target = allocation.filter(a=>a && a.phase).sort((a,b)=> ((b.phase?.target_intensity==='High'?1:0) - (a.phase?.target_intensity==='High'?1:0)))[0];
    if (!target) break; // Safety check in case allocation is empty
    target.drills++; allocated++;
  }
  // Cap per core phase to 2 drills to prevent bloat
  allocation.forEach(a => { if (a && a.drills > 2) { const diff = a.drills - 2; a.drills = 2; remaining += diff; } });
  // If we freed some remaining, distribute again one by one across phases with lowest count
  if (remaining>0) {
    const list = allocation.slice().sort((a,b)=>a.drills-b.drills);
    for (let i=0;i<list.length && remaining>0;i++) { list[i].drills++; remaining--; }
  }
  // Now pick drills for each core phase per allocation
  const coreDrillMap = {};
  allocation.forEach(a => {
    if (a && a.phase && a.phase.name) {
      coreDrillMap[a.phase.name] = pickDrillsForPhase(
        a.phase.name,
        load === 'High' ? (a.phase.phase_type==='technical'?'Medium':load) : load,
        a.drills
      );
    }
  });

  const generationMode = plan?.settings?.generationMode || 'curated';
  if (generationMode === 'generative' || generationMode === 'hybrid') {
    const phasesNeedingGen = [];
    if (generationMode === 'generative') {
      // All core phases + warm/cool
      if (warmPhase) phasesNeedingGen.push(warmPhase);
      corePhases.forEach(p=> phasesNeedingGen.push(p));
      if (coolPhase) phasesNeedingGen.push(coolPhase);
    } else { // hybrid: only empty ones
      if (warmPhase && warm.length===0) phasesNeedingGen.push(warmPhase);
      corePhases.forEach(p=> { if (!coreDrillMap[p.name] || coreDrillMap[p.name].length===0) phasesNeedingGen.push(p); });
      if (coolPhase && cool.length===0) phasesNeedingGen.push(coolPhase);
    }
    if (phasesNeedingGen.length) {
      const genResult = await generateDrillsViaModel(phasesNeedingGen, { warmPhase, coolPhase, corePhases });
      phasesNeedingGen.forEach(p => {
        const list = genResult[p.name] || genResult[p.name.replace(/_/g,' ')] || [];
        if (!list.length) return; // keep existing if generation failed
        if (/warm/i.test(p.name)) {
          warm.length = 0; list.slice(0,2).forEach(d=>warm.push(d));
        } else if (/cool/i.test(p.name)) {
          cool.length = 0; list.slice(0,2).forEach(d=>cool.push(d));
        } else {
          coreDrillMap[p.name] = list;
        }
      });
    }
  }
  // For backward compatibility keep named references if original canonical names exist
  const tech = Object.entries(coreDrillMap).filter(([name])=>/Technical/i.test(name)).flatMap(([_,list])=>list);
  const tact = Object.entries(coreDrillMap).filter(([name])=>/Tactic|Transition/i.test(name)).flatMap(([_,list])=>list);

  // Compose richer instructions & metadata for each drill
  function enrichDrill(d, phaseName) {
    const src = d.raw || d; // full original if available
    const coaching = src.coaching_points ? `Coaching Points: ${Array.isArray(src.coaching_points) ? src.coaching_points.join('; ') : src.coaching_points}` : '';
    const constraints = src.constraints ? `Constraints: ${Array.isArray(src.constraints) ? src.constraints.join('; ') : src.constraints}` : '';
    const progressions = src.progressions ? `Progressions: ${Array.isArray(src.progressions) ? src.progressions.slice(0,2).join('; ') : src.progressions}` : '';
    const regressions = src.regressions ? `Regressions: ${Array.isArray(src.regressions) ? src.regressions.slice(0,2).join('; ') : src.regressions}` : '';
    const space = src.space?.dimensions ? `Space: ${src.space.dimensions}` : '';
    const players = src.players?.arrangement ? `Players: ${src.players.arrangement}` : '';
    const objective = src.objective_primary ? `Objective: ${src.objective_primary}` : '';
    const secondaries = src.objectives_secondary?.length ? `Secondary: ${src.objectives_secondary.join('; ')}` : '';
    const equipmentList = Array.isArray(src.equipment) ? src.equipment : (typeof src.equipment === 'string' ? src.equipment.split(',').map(s => s.trim()).filter(Boolean) : []);
    const equipment = equipmentList.length ? `Equipment: ${equipmentList.join(', ')}` : '';
    const merged = [objective, secondaries, players, space, equipment, coaching, constraints, progressions, regressions]
      .filter(Boolean)
      .join(' \n');
    return {
      ...d,
      enriched_instructions: merged,
      phase: phaseName,
    };
  }

  function enrichDrillList(list, phaseName) { return list.map(dr => enrichDrill(dr, phaseName)); }

  const warmE = enrichDrillList(warm, warmPhase?.name || 'Warm Up');
  const coolE = enrichDrillList(cool, coolPhase?.name || 'Cool Down');
  // Enrich each dynamic core phase separately to preserve naming
  const coreEnriched = Object.entries(coreDrillMap).reduce((acc,[phaseName,list]) => { acc[phaseName] = enrichDrillList(list, phaseName); return acc; }, {});

  // Build rationale referencing plan principles & session load
  const rawPrinciples = plan.principles || [];
  const principleArr = Array.isArray(rawPrinciples)
    ? rawPrinciples
    : (typeof rawPrinciples === 'string'
        ? rawPrinciples.split(/;|,/).map(s=>s.trim()).filter(Boolean)
        : []);
  function phaseRationale(phaseName) {
    const first = principleArr[0] || '';
    const firstTwo = principleArr.slice(0,2).join('; ');
    if (phaseName === 'Warm Up') return `Progressive neuromuscular activation aligned with ${load} load${first?'. '+first:''}`.trim();
    if (phaseName === 'Technical') return `Technical quality & execution under appropriate tempo for a ${load} day.`;
    if (phaseName === 'Tactical') return `Applied tactical theme reflecting periodization${firstTwo? ' & principles: '+firstTwo:''}`.trim();
    if (phaseName === 'Cool Down') return 'Down-regulation and recovery facilitation to consolidate adaptations.';
    return 'Phase emphasis aligned with session objectives.';
  }

  function attachPhaseMeta(name, drills) {
    const skeleton = originalPhases.find(p => p.name.toLowerCase() === name.toLowerCase());
    const totalDuration = drills.reduce((acc, d) => acc + (d.duration || 0), 0);
    // Map simple phase -> principles subset heuristic
    let principles_applied = [];
    const sessionPrinciples = session.principles_applied || [];
    if (name === 'Warm Up') principles_applied = sessionPrinciples.filter(p => /Mobility|Support|Transition to Attack|Transition to Defend/i.test(p)).slice(0,2);
    else if (/Technical/i.test(name)) principles_applied = sessionPrinciples.filter(p => /Support|Width|Penetration|Mobility/i.test(p)).slice(0,3);
    else if (/Tactic|Transition/i.test(name)) principles_applied = sessionPrinciples.filter(p => /Pressure|Cover|Compactness|Penetration|Transition/i.test(p)).slice(0,3);
    else if (name === 'Cool Down') principles_applied = sessionPrinciples.filter(p => /Control|Compactness|Support/i.test(p)).slice(0,2);
    return {
      name,
      focus: skeleton?.focus || skeleton?.description || undefined,
      target_intensity: skeleton?.target_intensity || skeleton?.intensity || undefined,
      duration: totalDuration,
      rationale: phaseRationale(name),
      equipment: Array.from(new Set(drills.flatMap(d => (d.equipment ? d.equipment.split(',').map(x => x.trim()) : [])))).slice(0,6).join(', '),
      principles_applied,
      drills
    };
  }

  // Optional model refinement: create better textual phase descriptions (without altering drills)
  const apiKey = getApiKey();
  // (Optionally future: model refinement to rewrite rationale or add coaching emphasis)
  // Reconstruct phases preserving original order from skeleton with dynamic core
  const newPhases = [];
  if (warmPhase) newPhases.push(attachPhaseMeta(warmPhase.name, warmE));
  // For each core phase in appearance order attach its specific drills
  corePhases.forEach(p => {
    const list = coreEnriched[p.name] || [];
    newPhases.push(attachPhaseMeta(p.name, list));
  });
  if (coolPhase) newPhases.push(attachPhaseMeta(coolPhase.name, coolE));
  session.phases = newPhases;
  // Compute session intensity dynamically from drills if available
  const loadScoreMap = { low:1, medium:2, high:3, match:3 };
  const allDrills = newPhases.flatMap(p => p.drills || []);
  if (allDrills.length) {
    const avg = allDrills.reduce((acc,d)=> acc + (loadScoreMap[(d.load||'').toLowerCase()]||2),0)/allDrills.length;
    let label;
    if (avg < 1.6) label = 'Low'; else if (avg < 2.4) label = 'Medium'; else label = 'High';
    session.computed_intensity = { average_score: avg, label };
  }
  // Store principle coverage snapshot for potential downstream analytics
  session.principle_coverage_snapshot = Array.from(principleCounts.entries()).map(([name,count])=>({ name, count }));
  session.drills_generated = true;
  session.drill_generation_at = new Date().toISOString();
  session.drill_warning = (!warm.length || !tech.length || !tact.length) ? 'Some phases missing drills due to limited library' : null;
  // Return updated session only (plan object mutated in-place expected by UI) 
  return session;
}

// Public helper to regenerate a single session (mutates nothing, just returns new session)
export async function regenerateSession(plan, sessionIndex) {
  return generateSessionDrills(plan, sessionIndex, { useModelRefinement: false });
}

// Main function to generate a complete team plan
export async function generateTeamPlan(teamId, weeksOrOptions = 5) {
  // For backward compatibility: now performs FULL generation (high-level + drills) using new high-level path + per-session detail.
  let options = {};
  if (typeof weeksOrOptions === 'object') {
    options = { ...weeksOrOptions };
  } else {
    options.weeks = weeksOrOptions;
  }
  if (!options.startDate) {
    options.startDate = new Date().toISOString().split('T')[0];
  }
  if (!options.weeks && !options.endDate) {
    options.weeks = 5; // default
  }
  if (options.weeks && options.weeks > 6) options.weeks = 6;
  if (options.endDate) {
    // Clamp total days to 42
    const s = new Date(options.startDate);
    const e = new Date(options.endDate);
    const diffDays = Math.round((e - s) / 86400000) + 1;
    if (diffDays > 42) {
      e.setDate(s.getDate() + 41);
      options.endDate = e.toISOString().split('T')[0];
    }
  }

  const team = squads.find(s => s.id === teamId);
  if (!team) return 'Team not found';
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return 'Please add your AI API key in settings or set VITE_GEMINI_API_KEY in .env to enable AI generation.';
  }

  const isoStart = options.startDate;
  
  // Use fixtures from options if provided (from Supabase), otherwise fallback to static data
  let teamFixtures;
  if (options.fixtures && Array.isArray(options.fixtures)) {
    // Convert Supabase fixtures ensuring normalized date
    teamFixtures = options.fixtures.map(f => ({
      date: (()=>{ try { return new Date(f.date).toISOString().split('T')[0]; } catch { return (f.date||'').split('T')[0]; } })(),
      home_team: f.home_team || team.name,
      away_team: f.away_team || f.opponent,
      competition: f.competition || 'League'
    }));
  } else {
    // Fallback to static data
    teamFixtures = games.filter(g => g.home_team === team.name || g.away_team === team.name);
  }
  
  const endLimit = options.endDate || formatDate(isoStart, (options.weeks || 1) * 7);
  const fixturesInRange = teamFixtures.filter(f => f.date >= isoStart && f.date <= endLimit);

  // 1. Build timeline
  const timeline = buildTimeline(team, fixturesInRange, options);

  const totalDays = timeline.length;
  const durationDescriptor = options.endDate ? (totalDays + '-day') : (options.weeks + '-week');

  // 2. Generate summary/principles
  let meta;
  try {
    meta = await generateSummary(team, fixturesInRange, durationDescriptor, timeline, options.objective);
  } catch (e) {
    meta = { summary: 'Summary generation failed (fallback).', principles: [] };
  }
  let focus_principles = [];
  try { focus_principles = deriveFocusPrinciples(options.userSelectedPrinciples); } catch { focus_principles = []; }

  // 3. Generate sessions sequentially (could be parallel but keep token moderation & ordering)
  // Use new skeleton derivation then populate drills (legacy behavior) sequentially
  const sessions = timeline.map(day => deriveSessionSkeleton(day));
  for (let i = 0; i < sessions.length; i++) {
    try {
      await generateSessionDrills({ team: team.name, principles: meta.principles, timeline, sessions }, i, { useModelRefinement: false });
    } catch (e) {
      sessions[i].error = 'drill-generation-failed';
    }
  }

  // 4. Validation
  const warnings = [];
  if (sessions.length !== timeline.length) warnings.push('Session count mismatch');
  sessions.forEach((s, idx) => {
  if (!s.phases || s.phases.length === 0) warnings.push('Session ' + (idx + 1) + ' empty phases');
  });

  return {
    summary: meta.summary,
    principles: meta.principles,
    principles_of_play: principlesData.principles_of_play,
    focus_principles,
    timeline,
    sessions,
    matches: timeline.filter(d=> d.isFixture).map(d => ({
      date: d.date,
      opponent: d.fixture?.opponent,
      home: d.fixture?.home,
      match_number: d.fixture?.match_number,
      importance_weight: d.fixture?.importance_weight,
      competition: d.fixture?.raw?.competition || d.fixture?.raw?.competition_name || ''
    })),
    generated_at: new Date().toISOString(),
    team: team.name,
    weeks: options.weeks || null,
    start_date: options.startDate,
    end_date: options.endDate || null,
    total_days: timeline.length,
    warnings,
    settings: {
      variability: options.variability || 'medium',
      objective: options.objective || '',
      selectedPrinciples: options.userSelectedPrinciples || [],
      generationMode: options.generationMode || 'curated' // Ensure included in legacy return path
    }
  };
}

// ----------------- USER OVERRIDE UTILITIES -----------------
// Allow UI to change a day's load_class then rebuild its session skeleton (and optionally invalidate drills)
export function updateDayLoad(plan, dayIndex, newLoadClass, { invalidateDrills = true } = {}) {
  if (!plan || !plan.timeline || !plan.timeline[dayIndex]) return plan;
  const day = plan.timeline[dayIndex];
  day.load_class = newLoadClass;
  day.color = LOAD_COLOR_MAP[newLoadClass] || day.color;
  day.label = LOAD_LABEL_MAP[newLoadClass] || day.label;
  // Regenerate session skeleton preserving date & match status
  const newSkeleton = deriveSessionSkeleton({ ...day, color: day.color, isFixture: day.isFixture });
  const existing = plan.sessions[dayIndex];
  if (existing) {
    // Replace only high-level fields; keep name if user edited
    const preservedName = existing.userRenamed ? existing.name : newSkeleton.name;
    plan.sessions[dayIndex] = { ...newSkeleton, name: preservedName };
  } else {
    plan.sessions[dayIndex] = newSkeleton;
  }
  if (invalidateDrills && plan.sessions[dayIndex]) {
    plan.sessions[dayIndex].drills_generated = false;
    plan.sessions[dayIndex].phases.forEach(p => { delete p.drills; });
  }
  // Recompute weekly metrics since load distribution changed
  plan.weekly_metrics = computeWeeklyMetrics(plan.timeline);
  return plan;
}

export function markSessionNameEdited(plan, sessionIndex) {
  if (plan?.sessions?.[sessionIndex]) plan.sessions[sessionIndex].userRenamed = true;
  return plan;
}
