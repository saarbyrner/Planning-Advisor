// Plan analytics utility
// Computes aggregate metrics for a generated team plan.
// Safe to call on partial / high-level plans (returns null or minimal metrics if drills absent).

export function computePlanAnalytics(plan) {
  if (!plan || !Array.isArray(plan.sessions)) return null;
  const sessions = plan.sessions;
  const sessionCount = sessions.length;
  let drillCount = 0;
  let durationTotal = 0;
  const drillIdSet = new Set();
  const drillNameFreq = new Map();
  const loadFreq = { Low:0, Medium:0, High:0, Match:0 };
  const phaseTypeFreq = { warm:0, technical:0, tactical:0, transition:0, cool:0 };
  const principleFreq = new Map();
  const sessionIntensityLabels = { Low:0, Medium:0, High:0 };

  sessions.forEach(s => {
    if (!Array.isArray(s.phases)) return;
    s.phases.forEach(p => {
      durationTotal += p.duration || 0;
      const pt = (p.target_intensity || p.phase_type || '').toLowerCase();
      const normPhaseType = ['warm','technical','tactical','transition','cool'].find(x => (p.phase_type||'').toLowerCase() === x || p.name.toLowerCase().includes(x));
      if (normPhaseType) phaseTypeFreq[normPhaseType]++;
      (p.drills||[]).forEach(d => {
        drillCount++;
        if (d.id) drillIdSet.add(d.id);
        drillNameFreq.set(d.name, (drillNameFreq.get(d.name)||0)+1);
        const load = (d.load || '').trim();
        if (/^low$/i.test(load)) loadFreq.Low++; else if (/^med/i.test(load)) loadFreq.Medium++; else if (/^high$/i.test(load)) loadFreq.High++; else if (/match/i.test(load)) loadFreq.Match++;
      });
      (p.principles_applied||[]).forEach(pr => principleFreq.set(pr, (principleFreq.get(pr)||0)+1));
    });
    if (s.computed_intensity?.label) {
      sessionIntensityLabels[s.computed_intensity.label] = (sessionIntensityLabels[s.computed_intensity.label]||0)+1;
    }
  });

  // Diversity metrics
  const uniqueDrills = drillIdSet.size || drillNameFreq.size;
  const uniquenessRatio = drillCount ? uniqueDrills / drillCount : 0;
  const topRepeats = Array.from(drillNameFreq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Principle coverage vs focus principles
  const focusSets = plan.focus_principles || {};
  const focusPrinciples = Array.from(new Set(Object.values(focusSets).flat()));
  const principleCoverage = focusPrinciples.map(pr => ({ name: pr, count: principleFreq.get(pr)||0 }));
  const uncoveredPrinciples = principleCoverage.filter(p => p.count === 0).map(p => p.name);

  // Load distribution normalization
  const loadTotal = Object.values(loadFreq).reduce((a,b)=>a+b,0) || 1;
  const loadDistribution = Object.fromEntries(Object.entries(loadFreq).map(([k,v])=>[k, v]));

  // Phase balance score (simple evenness measure across non-zero phase types)
  const phaseValues = Object.values(phaseTypeFreq).filter(v=>v>0);
  const phaseEvenness = phaseValues.length ? (Math.min(...phaseValues) / Math.max(...phaseValues || [1])) : 0;

  // Qualitative labels
  function labelUniqueness(r) { if (r>=0.85) return 'Excellent'; if (r>=0.7) return 'Good'; if (r>=0.55) return 'Moderate'; return 'Needs Variety'; }
  function labelEvenness(e) { if (e>=0.75) return 'Balanced'; if (e>=0.5) return 'Slight Skew'; return 'Skewed'; }
  const totalPrincipleMentions = principleCoverage.reduce((a,b)=>a+b.count,0) || 1;
  const principleCoveragePct = principleCoverage.map(p => ({ ...p, pct: +(p.count / totalPrincipleMentions * 100).toFixed(1) }));
  const loadTotal2 = Object.values(loadDistribution).reduce((a,b)=>a+b,0) || 1;
  const loadDistributionPct = Object.fromEntries(Object.entries(loadDistribution).map(([k,v])=>[k, +(v/loadTotal2*100).toFixed(1)]));
  const uniquenessPct = +(uniquenessRatio*100).toFixed(1);
  return {
    sessions: sessionCount,
    drills: drillCount,
    totalDurationMinutes: durationTotal,
    uniqueDrills,
    uniquenessRatio: +uniquenessRatio.toFixed(3),
    uniquenessPct,
    uniquenessLabel: labelUniqueness(uniquenessRatio),
    topRepeats: topRepeats.map(([name,count])=>({ name, count })),
    loadDistribution,
    loadDistributionPct,
    phaseTypeFreq,
    phaseEvenness: +phaseEvenness.toFixed(2),
    phaseEvennessLabel: labelEvenness(phaseEvenness),
    principleCoverage: principleCoveragePct,
    uncoveredPrinciples,
    intensitySessionCounts: sessionIntensityLabels,
    generatedAt: plan.generated_at
  };
}
