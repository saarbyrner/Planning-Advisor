# Developer Guide

## ⚡ Quick Setup

```bash
npm install                    # Install dependencies
npm run dev                    # Start development server
npm run validate-design-system # Check compliance
```

## 📦 Components

```jsx
// Import design-compliant components
import { Button, Icon, Card, PlayerAvatar, LogoImage } from './components'

// Basic usage
<Button variant="contained" size="small">Add athlete</Button>
<PlayerAvatar playerId="123" playerName="John Smith" />
<LogoImage type="team" logoId="arsenal" league="premier-league" />
```

## 🎨 Design Tokens

**File:** `src/styles/design-tokens.css`

```css
/* ✅ Use design tokens */
color: var(--color-primary);      /* #3B4960 */
background: var(--color-secondary); /* #F1F2F3 */

/* ❌ Hardcoded colors auto-blocked */
color: #3B4960;  /* ESLint error */
```

## 📊 Mock Data

**Available files in `src/data/`:**
- `athletes.json` - Player profiles
- `teams.json` - Team info with logos
- `squads_teams.json` - Squad rosters
- `games_matches.json` - Match results

```jsx
import athletesData from '../data/athletes.json'
import teamsData from '../data/teams.json'
```

## 🔄 Development Workflow

1. **Start development:** `npm run dev`
2. **Add new page:** Edit `src/App.jsx`
3. **Use components:** Import from `./components`
4. **Validate code:** `npm run validate-design-system`
5. **Commit:** Pre-commit hooks auto-check compliance

## 🛠️ Commands

```bash
npm run dev                    # Development server
npm run validate-design-system # Full compliance check
npm run lint                   # JavaScript validation
npm run lint:css               # CSS validation
npm run lint:fix               # Auto-fix issues
npm run build                  # Production build
```

## ❌ Common Validation Errors

**Hardcoded colors:**
```css
/* ❌ Error */ color: #3B4960;
/* ✅ Fix */   color: var(--color-primary);
```

**Wrong button variant:**
```jsx
/* ❌ Error */ <Button variant="outlined">
/* ✅ Fix */   <Button variant="contained">
```

**Wrong icons:**
```jsx
/* ❌ Error */ import { Dashboard }
/* ✅ Fix */   import { DashboardOutlined }
```

**Text casing:**
```jsx
/* ❌ Error */ "Add Athlete"
/* ✅ Fix */   "Add athlete"
```

## 📚 Key Files

- `src/styles/design-tokens.css` - Color variables
- `src/components/index.js` - Component exports
- `src/data/*.json` - Mock data files
- `.eslintrc.js` - JavaScript rules
- `.stylelintrc.json` - CSS rules
- `.husky/pre-commit` - Validation hooks