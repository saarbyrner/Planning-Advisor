#!/usr/bin/env node
/**
 * Drill Import & Validation Skeleton
 * ---------------------------------
 * Purpose: Provide a safe pipeline to ingest new drills from curated sources
 * (official governing bodies, licensed aggregators, YouTube references) into
 * the enriched drills library.
 *
 * This script DOES NOT scrape. Instead it expects a staged JSON file created
 * manually or via a separate authorized ETL process.
 *
 * Usage (planned):
 *   node scripts/import-drills.js --input tmp/new_drills_batch.json --out src/data/drills_enriched.json
 *
 * Validation steps:
 *  - Schema conformity
 *  - Required field presence (id, name, phase, objective_primary, duration_min/max, media.alt_text)
 *  - Duplicate id prevention
 *  - Source quality weighting bounds (0-1)
 *  - Legal flags: ensures no verbatim copyrighted text longer than threshold (heuristic)
 *  - Tag normalization (lowercase, snake-case)
 *
 * TODO (future):
 *  - Add optional OpenAI / Gemini content moderation call for safety
 *  - Integrate diagram generation (SVG) using procedural templates
 *  - Provide CLI option to auto-fill derived fields (average duration, slug)
 */

import fs from 'fs';
import path from 'path';
import process from 'process';

const REQUIRED_FIELDS = ['id','name','phase','objective_primary','duration_min','duration_max'];

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p,'utf8'));
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2)+'\n');
}

function normalizeTag(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}

function validateDrill(drill) {
  const errors = [];
  REQUIRED_FIELDS.forEach(f => { if (drill[f] === undefined || drill[f] === null || drill[f] === '') errors.push(`Missing field: ${f}`); });
  if (typeof drill.duration_min !== 'number' || typeof drill.duration_max !== 'number') errors.push('duration_min/max must be numbers');
  if (drill.duration_min > drill.duration_max) errors.push('duration_min cannot exceed duration_max');
  if (drill.source) {
    if (typeof drill.source.quality_weight !== 'number' || drill.source.quality_weight < 0 || drill.source.quality_weight > 1) {
      errors.push('source.quality_weight must be 0..1');
    }
  }
  // Heuristic copyright risk: long exact paragraphs (>400 chars) not allowed
  ['instructions','coaching_points','objective_primary'].forEach(field => {
    const val = drill[field];
    if (typeof val === 'string' && val.length > 400) errors.push(`Field ${field} too long (>400 chars) potential copyright risk`);
  });
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf('--input');
  const outIdx = args.indexOf('--out');
  if (inputIdx === -1 || outIdx === -1) {
    console.error('Usage: node scripts/import-drills.js --input tmp/new_batch.json --out src/data/drills_enriched.json');
    process.exit(1);
  }
  const inputPath = path.resolve(args[inputIdx+1]);
  const outPath = path.resolve(args[outIdx+1]);
  const newDrills = loadJSON(inputPath);
  const existing = fs.existsSync(outPath) ? loadJSON(outPath) : [];
  const existingIds = new Set(existing.map(d => d.id));

  const merged = [...existing];
  let added = 0;
  const report = [];
  newDrills.forEach(d => {
    const errs = validateDrill(d);
    if (existingIds.has(d.id)) {
      report.push({ id: d.id, status: 'skipped-duplicate' });
      return;
    }
    if (errs.length) {
      report.push({ id: d.id, status: 'failed-validation', errors: errs });
      return;
    }
    if (Array.isArray(d.tags)) d.tags = d.tags.map(normalizeTag);
    merged.push(d);
    existingIds.add(d.id);
    added++;
    report.push({ id: d.id, status: 'added' });
  });

  saveJSON(outPath, merged);
  console.log(`Added ${added} drills. Total now ${merged.length}. Detailed report:`);
  console.table(report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (e) {
    console.error('Import failed:', e);
    process.exit(1);
  }
}
