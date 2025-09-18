# Drill Data Model & Sourcing Guidelines

## Purpose
Provide a structured, extensible schema for high-quality football (soccer) training drills so AI-generated session plans can assemble evidence-based, media-rich content combining:
- Governing body methodology (FA, USSF, RFEF)
- Tactical periodization concepts
- Media (images / diagrams / video references)
- Clear coaching constraints & progressions/regressions

## JSON Schema (current v1)
Field | Type | Description
------|------|------------
`id` | string | Stable unique id (kebab or snake case)
`name` | string | Human-readable title (non-copyright descriptive)
`phase` | enum | `Warm Up` | `Technical` | `Tactical` | `Cool Down` (future: `Physical`, `Set Piece`)
`category` | string[] | High-level tags grouping drill nature (e.g. `passing`, `pressing`)
`age_groups` | string[] | Target age bands (e.g. `U13+`, `U15+`, `Senior`)
`objective_primary` | string | Core objective (short, <=120 chars)
`objectives_secondary` | string[] | Secondary aims
`duration_min` / `duration_max` | number | Realistic bounds in minutes
`workload` | enum | `Low` | `Medium` | `High` (match day handled separately)
`intensity_descriptor` | string | Qualitative load descriptor for sports scientist/context
`players.total` | number | Typical total participants
`players.arrangement` | string | Setup description (non-copyright)
`players.rotations` | string|null | Rotation rules
`constraints` | string[] | Task constraints / condition rules
`equipment` | string[] | Distinct equipment list
`space.dimensions` | string | Base size
`space.adaptation` | string | How to scale difficulty
`coaching_points` | string[] | Key coaching cues (bite-sized)
`progressions` | string[] | Add complexity / intensity
`regressions` | string[] | Simplify for lower ability / fatigue
`safety_notes` | string[] | Risk mitigation
`source` | object | Metadata about origin inspiration (DO NOT copy prose) => {`name`,`url`,`category`,`quality_weight`(0..1)}
`media.diagram_svg` | string|null | (Future) Embedded simple SVG diagram
`media.image_urls` | string[] | Static images (local or CDN) you are allowed to distribute
`media.video_urls` | string[] | External references (YouTube links) as optional visual aid
`media.alt_text` | string | Accessibility alt text
`tags` | string[] | Normalized snake_case tags for filtering
`language` | string | ISO language code
`last_reviewed` | date | YYYY-MM-DD for curation freshness
`validation.curated` | boolean | Human curation flag
`validation.reviewer_initials` | string | Auditor initials

## Selection Heuristics (implemented)
During session generation we:
1. Map planned day load color -> target workload.
2. Filter drills by matching `phase`.
3. Score: `quality_weight - workload_distance*0.15 + tiny_recency_factor`.
4. Slice top N per phase and embed directly into the LLM prompt so the model keeps them (reducing hallucinated drills).
5. Post-parse: Re-attach original `media` & `source` in case model rewrites names.

## Legal & Ethical Notes
- Do NOT copy full textual descriptions from premium or official sources. Summaries must be original phrasing.
- Store only metadata + transformed instructional essence.
- For premium providers (e.g. The Coaching Manual, Sportplan) seek API/partnership; do not scrape.
- YouTube: embed URL only; no transcript ingestion without permission.
- Include `source.quality_weight` to bias toward verified / official methodology.

## Future Roadmap
Phase | Feature | Notes
------|---------|------
1 | SVG auto-diagram generation | Procedural shapes (pitches, cones, players) via simple DSL
1 | Add `set_piece` phase | Corners / free kicks library
2 | Energy system tagging | e.g. `anaerobic_alactic`
2 | RPE & GPS expected ranges | For integration with load monitoring
2 | Multi-language variants | `translations` field for localized UI
3 | API ingestion microservice | Secure admin-only endpoint for adding drills
3 | Embedding search | Vectorize `objective_primary + coaching_points` for semantic retrieval

## Contribution Workflow
1. Create draft JSON in `tmp/` following schema.
2. Run: `node scripts/import-drills.js --input tmp/batch.json --out src/data/drills_enriched.json`.
3. Inspect console report; fix validation fails.
4. Commit changes + reference curation date.

## Example Drill (abridged)
See `src/data/drills_enriched.json` for live examples.

## UI / UX Integration Ideas
- Hover over drill name -> tooltip with coaching points & media thumbnail.
- Expandable phase row -> embedded video player (lazy loaded) when user clicks.
- Filter pane: tags, workload, age group, source quality slider.

## AI Prompting Strategy Enhancements (Next)
- Provide the model only high-level session skeleton; keep full drill detail purely client-side for determinism.
- Add reinforcement message: "Do NOT rename provided drills; keep names exactly for media linking.".
- Introduce fallback deterministic assembly when model JSON parse fails (already partly implemented) referencing local library entirely.

---
Maintained: 2025-09-18
