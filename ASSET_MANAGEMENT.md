# Asset Management Guide

## 📁 Asset Structure

**Team logos included from https://github.com/klunn91/team-logos**

```
public/assets/
├── logos/
│   ├── teams/
│   │   ├── premier-league/    # Arsenal, Chelsea, Liverpool, etc.
│   │   └── nba/              # Lakers, Warriors, Bulls, etc.
│   └── Kitman Labs base.png  # Organization logo
└── players/                   # Player photos (auto-generates initials)
```

## 🏆 Available Team Logos

**Premier League:** Arsenal, Chelsea, Liverpool, Manchester United, Manchester City, Tottenham, Everton, Leeds United

**NBA:** Lakers, Warriors, Bulls, Celtics

## 💻 Component Usage

```jsx
import { PlayerAvatar, LogoImage } from './components'

// Player avatar (auto-generates initials if no photo)
<PlayerAvatar playerId="123" playerName="John Smith" size="medium" />

// Team logos
<LogoImage type="team" logoId="arsenal" league="premier-league" height={40} />
<LogoImage type="team" logoId="lakers" league="nba" height={40} />

// Organization logo
<LogoImage type="organization" logoId="organization-logo" height={40} />
```

## ✅ Auto Features

- **Player avatars:** Auto-generates initials if photo missing
- **Team logos:** Organized by league (premier-league, nba)
- **Fallbacks:** Graceful handling of missing assets
- **Loading states:** Smooth transitions

**Asset Registry** (`src/utils/assetManager.js`):
```jsx
teams: {
  'premier-league': ['arsenal.png', 'chelsea.png', 'liverpool.png', ...],
  'nba': ['lakers.png', 'warriors.png', 'bulls.png', ...]
}
```

## 📝 Asset Manager Functions

```jsx
import { getTeamLogo, getAvailableTeamLogos, getAvailableLeagues } from '../utils/assetManager'

// Get team logo path
const logoPath = getTeamLogo('arsenal', 'premier-league')
// Returns: '/assets/logos/teams/premier-league/arsenal.png'

// Get all available teams for a league
const premierLeagueTeams = getAvailableTeamLogos('premier-league')
// Returns: ['arsenal.png', 'chelsea.png', ...]

// Get all available leagues
const leagues = getAvailableLeagues()
// Returns: ['premier-league', 'nba']
```

## 📁 Mock Data Integration

**Team data** (`src/data/teams.json`) includes logo references:
```json
{
  "id": "arsenal",
  "name": "Arsenal FC",
  "logo": "arsenal",
  "league": "premier-league"
}
```

**Squad data** (`src/data/squads_teams.json`) includes team logos:
```json
{
  "name": "First Team",
  "logo": "arsenal",
  "league": "premier-league",
  "next_match": {
    "opponent": "Liverpool FC",
    "opponent_logo": "liverpool"
  }
}
```

## 🎯 Adding New Assets

1. **Add team logo:** Place PNG in `public/assets/logos/teams/{league}/`
2. **Update registry:** Add filename to `ASSET_REGISTRY.teams[league]` in `assetManager.js`
3. **Use in data:** Reference logo ID in JSON files
4. **Component usage:** `<LogoImage type="team" logoId="new-team" league="your-league" />`