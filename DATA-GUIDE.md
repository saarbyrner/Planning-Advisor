# Data Guide

## 📊 Available Mock Data

**9 JSON files** in `src/data/` with realistic sports management data.

## 📁 Key Files

**`athletes.json`** - 8 player profiles
```json
{
  "firstname": "Marcus", "lastname": "Johnson",
  "position": "Forward", "age": 25,
  "availability_status": "Available",
  "performance_score": 85
}
```

**`teams.json`** - Premier League & NBA teams with logos
```json
{
  "id": "arsenal",
  "name": "Arsenal FC", 
  "logo": "arsenal",
  "league": "premier-league"
}
```

**`squads_teams.json`** - 4 squads with formations & stats
```json
{
  "name": "First Team",
  "coach": "Roberto Martinez",
  "formation": "4-3-3",
  "logo": "arsenal",
  "league": "premier-league"
}
```

**`games_matches.json`** - Match results with player performances
**`injuries_medical.json`** - Medical records and recovery data
**`training_sessions.json`** - Training data with exercises
**`assessments.json`** - Performance evaluations
**`questionnaires_wellbeing.json`** - Wellness questionnaires
**`users_staff.json`** - Staff profiles and roles

## 💻 Usage

```jsx
// Import data files
import athletesData from '../data/athletes.json'
import teamsData from '../data/teams.json'
import squadsData from '../data/squads_teams.json'

// Use in components
function AthleteList() {
  return (
    <div>
      {athletesData.map(athlete => (
        <PlayerAvatar 
          key={athlete.id}
          playerId={athlete.id}
          playerName={`${athlete.firstname} ${athlete.lastname}`}
        />
      ))}
    </div>
  )
}
```

## 🔄 Data Relationships

- **Athletes** ↔ **Squads** (via squad_name)
- **Teams** ↔ **Squads** (via logo/league)
- **Games** ↔ **Athletes** (via player_performances)
- **Injuries** ↔ **Athletes** (via athlete_name)

## ✏️ Customizing Data

1. **Edit JSON files** directly in `src/data/`
2. **See changes instantly** in the prototype
3. **Test scenarios:** injuries, formations, match results
4. **Add teams:** Include new logo files and update teams.json