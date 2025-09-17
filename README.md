# Design Prototype Template

Clean, reusable prototype template with design system enforcement and sports team assets.

## 🚀 Quick Start

```bash
npm install    # Install dependencies
npm run dev    # Start development server
```
**Open browser:** http://localhost:5173

## 📁 What You Get

- **Design System**: Pre-built components with automatic brand compliance
- **Sports Assets**: Premier League and NBA team logos included
- **Mock Data**: Realistic sports management data (athletes, teams, matches)
- **Auto-Validation**: Pre-commit hooks prevent design violations

## 🎯 Core Components

```jsx
import { Button, Icon, Card, PlayerAvatar, LogoImage } from './components'

<Button variant="contained" size="small">Add athlete</Button>
<PlayerAvatar playerId="123" playerName="John Smith" />
<LogoImage type="team" logoId="arsenal" league="premier-league" height={40} />
```

**Design Rules (Auto-Enforced):**
- Colors: Use `var(--color-primary)` instead of `#3B4960`
- Buttons: Only `variant="contained"` allowed
- Icons: Material Icons Outlined only
- Text: Sentence case ("Add athlete" not "Add Athlete")

## 📂 Key Files

```
src/
├── components/           # Pre-built components (Button, Card, etc.)
├── styles/design-tokens.css  # Colors: --color-primary, --color-secondary
├── data/                 # Mock JSON data (athletes, teams, matches)
│   ├── athletes.json
│   ├── teams.json
│   └── squads_teams.json
└── utils/assetManager.js # Team logo handling

public/assets/logos/teams/
├── premier-league/       # Arsenal, Chelsea, Liverpool, etc.
└── nba/                  # Lakers, Warriors, Bulls, etc.
```

## 🛠️ Commands

```bash
npm run dev                    # Start development
npm run validate-design-system # Check compliance
npm run lint                   # Fix code style
```

## 📊 Mock Data

**Available datasets** (all in `src/data/`):
- `athletes.json` - Player profiles and stats
- `teams.json` - Premier League and NBA teams
- `squads_teams.json` - Squad rosters and formations
- `games_matches.json` - Match results and fixtures
- `injuries_medical.json` - Medical data

## 🏆 Team Logos

**Premier League:** Arsenal, Chelsea, Liverpool, Manchester United, Manchester City, Tottenham, Everton, Leeds United

**NBA:** Lakers, Warriors, Bulls, Celtics

```jsx
<LogoImage type="team" logoId="arsenal" league="premier-league" />
<LogoImage type="team" logoId="lakers" league="nba" />
```

## 📋 Design Rules (Auto-Enforced)

**Pre-commit hooks prevent:**
- ❌ Hardcoded colors (`#3B4960` → use `var(--color-primary)`)
- ❌ Wrong button variants (`outlined` → use `contained`)
- ❌ Non-outlined icons (`Dashboard` → use `DashboardOutlined`)
- ❌ Title Case text (`Add Athlete` → use `Add athlete`)

## 🎯 Quick Tips

- **Colors:** Edit `src/styles/design-tokens.css`
- **Navigation:** Add pages in `src/App.jsx`
- **Data:** Use JSON files in `src/data/`
- **Assets:** Team logos auto-load from `public/assets/`
- **Validation:** Run `npm run validate-design-system`