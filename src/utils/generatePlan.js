// Two-step training plan generation utilities
// 1. High-level team plan (timeline + session skeletons, no drills)
// 2. Per-session drill population (deterministic selection from enriched library)

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import squads from '../data/squads_teams.json';
import games from '../data/games_matches.json';
import enrichedDrills from '../data/drills_enriched.json';
import principlesData from '../data/principles_of_play.json';

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
  const fixtureMap = new Map();
  fixtures.forEach(f => fixtureMap.set(f.date, f));
  const timeline = dates.map((d, idx) => {
    const iso = d.toISOString().split('T')[0];
    const fixture = fixtureMap.get(iso);
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
    } else {
      // Weekly micro-cycle based on position from start
      const micro = (idx % 7) + 1;
      if (micro === 1 || micro === 3 || micro === 5) {
        color = 'red'; label = 'High Intensity Training';
      } else if (micro === 2 || micro === 4) {
        color = 'yellow'; label = 'Medium Load Training';
      } else {
        color = 'green'; label = 'Recovery & Regeneration';
      }
    }
    return { day: idx + 1, date: iso, color, label, isFixture, fixture: fixture ? {
      opponent: (fixture.home_team||fixture.home) === team.name ? (fixture.away_team || fixture.away || fixture.opponent) : (fixture.home_team || fixture.home || fixture.opponent),
      home: (fixture.home_team||fixture.home) === team.name,
      raw: fixture
    } : null };
  });
  return timeline;
}

// Extended to optionally incorporate a user-defined objective focus statement.
async function generateSummary(team, fixtures, durationDescriptor, timeline, objective) {
  const taxonomy = principlesData.principles_of_play;
  const attackingList = taxonomy.attacking.map(p => p.name).join('; ');
  const defendingList = taxonomy.defending.map(p => p.name).join('; ');
  const transitionList = taxonomy.transition.map(p => p.name).join('; ');
  const prompt = `You are a performance periodization expert.
You have the following PRINCIPLES OF PLAY taxonomy.
Attacking: ${attackingList}
Defending: ${defendingList}
Transition: ${transitionList}
Return ONLY JSON with keys summary and principles.
summary: 1-2 paragraphs describing the ${durationDescriptor} plan structure for ${team.name} referencing fixture congestion, recovery strategy, and load distribution, and explicitly stating how selected principles from the taxonomy are emphasized.${objective ? ' Integrate this specific coaching objective: "'+objective.replace(/"/g,'\"')+'" (rephrase naturally).' : ''}
principles: semicolon delimited list (Attacking/Defending/Transition mix) of 5-9 core principles chosen from the taxonomy above (use exact names, no new ones).
NO markdown, ONLY compact JSON object like {"summary":"...","principles":"Penetration; Support; Pressure; Cover; Transition to Attack (Positive Transition); ..."}`;
  const { text } = await generateText({
    model: getGoogleAI()('models/gemini-1.5-flash-latest'),
    prompt,
    maxTokens: 800
  });
  try {
    const cleaned = text.trim().replace(/^```json|```$/g, '');
    return JSON.parse(cleaned);
  } catch {
    return { summary: text.slice(0, 500), principles: '' };
  }
}

// Derive a constrained focus principles subset (week-level) – 2 Attacking, 2 Defending, 1 Transition by default
function deriveFocusPrinciples(userSelectedPrinciples) {
  const p = principlesData.principles_of_play;
  // Categorize user-selected principles if provided
  if (Array.isArray(userSelectedPrinciples) && userSelectedPrinciples.length) {
    const byCat = { attacking: [], defending: [], transition: [] };
    const lookup = {
      attacking: new Set(p.attacking.map(x => x.name)),
      defending: new Set(p.defending.map(x => x.name)),
      transition: new Set(p.transition.map(x => x.name))
    };
    userSelectedPrinciples.forEach(name => {
      if (lookup.attacking.has(name)) byCat.attacking.push(name);
      else if (lookup.defending.has(name)) byCat.defending.push(name);
      else if (lookup.transition.has(name)) byCat.transition.push(name);
    });
    return byCat;
  }
  function pick(list, n) { return list.slice(0, n).map(x => x.name); }
  return {
    attacking: pick(p.attacking, 2),
    defending: pick(p.defending, 2),
    transition: pick(p.transition, 1)
  };
}

// Helper to derive a high-level session skeleton deterministically (no model call) based on load & fixture status.
function mapSessionPrinciples(loadLabel, isFixture) {
  const p = principlesData.principles_of_play;
  // helper: pick by names
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
  // Low / recovery
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
  const color = dayMeta.color;
  let loadLabel = color === 'red' ? 'High' : color === 'yellow' ? 'Medium' : 'Low';
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
    // Convert Supabase fixtures to the expected format
    teamFixtures = options.fixtures.map(f => ({
      date: f.date,
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
  const durationDescriptor = options.endDate ? (timeline.length + '-day') : (options.weeks + '-week');
  const meta = await generateSummary(team, fixturesInRange, durationDescriptor, timeline, options.objective);
  const focus_principles = deriveFocusPrinciples(options.userSelectedPrinciples);
  return {
    summary: meta.summary,
    principles: meta.principles,
    principles_of_play: principlesData.principles_of_play,
    focus_principles,
    timeline,
    sessions: timeline.map(deriveSessionSkeleton),
    generated_at: new Date().toISOString(),
    team: team.name,
    weeks: options.weeks || null,
    start_date: options.startDate,
    end_date: options.endDate || null,
    total_days: timeline.length,
    warnings: [],
    settings: {
      variability: options.variability || 'medium',
      objective: options.objective || '',
      selectedPrinciples: options.userSelectedPrinciples || []
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

  function pickDrillsForPhase(phaseName, targetLoad, maxDrills) {
    if (maxDrills <= 0) return [];
    const phaseKey = phaseName.toLowerCase();
    const focusSets = plan.focus_principles || {};
    const flatFocus = Object.values(focusSets).flat();
    // Pre-filter candidates by phase
    const candidatesRaw = enrichedDrills.filter(d => d.phase && d.phase.toLowerCase() === phaseKey);
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
      // Uniqueness penalties
      const recentPenalty = recentDrillIds.has(d.id) ? 0.25 : 0;
      const freqPenalty = usageFreq.has(d.id) ? Math.min(0.15 * usageFreq.get(d.id), 0.45) : 0;
      const withinSessionPenalty = pickedThisSession.has(d.id) ? 0.5 : 0; // strong penalty if somehow still present
      const score = quality - wlDistance * 0.18 + recency + principleBoost - recentPenalty - freqPenalty - withinSessionPenalty;
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
      weights[idx] = 0; // remove from future sampling
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
  const globalPrinciples = plan.principles || '';
  function phaseRationale(phaseName) {
    if (phaseName === 'Warm Up') return 'Progressive neuromuscular activation aligned with session load ' + load + '. ' + globalPrinciples.split(';')[0]?.trim();
    if (phaseName === 'Technical') return 'Technical quality under appropriate tempo scaling for ' + load + ' load day.';
    if (phaseName === 'Tactical') return 'Applied tactical theme reflecting weekly periodization & principles: ' + globalPrinciples.split(';').slice(0,2).join(';');
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
    // Convert Supabase fixtures to the expected format
    teamFixtures = options.fixtures.map(f => ({
      date: f.date,
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
  const meta = await generateSummary(team, fixturesInRange, durationDescriptor, timeline, options.objective);
  const focus_principles = deriveFocusPrinciples(options.userSelectedPrinciples);

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
      selectedPrinciples: options.userSelectedPrinciples || []
    }
  };
}
