# Design System Guide

## 🎨 Core Rules

### Colors (Auto-Enforced)
```css
/* ✅ CORRECT - Use design tokens */
color: var(--color-primary);      /* #3B4960 */
background: var(--color-secondary); /* #F1F2F3 */

/* ❌ WRONG - Hardcoded colors blocked by linting */
color: #3B4960;
background: #F1F2F3;
```

### Buttons (Auto-Enforced) 
```jsx
/* ✅ CORRECT - Only filled variants allowed */
<Button variant="contained" size="small">Add athlete</Button>

/* ❌ WRONG - Blocked by pre-commit hooks */
<Button variant="outlined">Add Athlete</Button>
<Button variant="text">ADD ATHLETE</Button>
```

### Icons (Auto-Enforced)
```jsx
/* ✅ CORRECT - Only Outlined variants allowed */
import { DashboardOutlined } from '@mui/icons-material';

/* ❌ WRONG - Blocked by ESLint rules */
import { Dashboard } from '@mui/icons-material';
```

### Text (Auto-Enforced)
```jsx
/* ✅ CORRECT - Sentence case enforced */
"Add athlete"    "Dashboard overview"

/* ❌ WRONG - Warned by linting */
"Add Athlete"    "DASHBOARD OVERVIEW"
```

## 📂 File Locations

**Design Tokens:** `src/styles/design-tokens.css`
```css
:root {
  --color-primary: #3B4960;
  --color-secondary: #F1F2F3;
  --color-success: #28a745;
  --color-error: #dc3545;
  --color-warning: #ffc107;
}
```

**Components:** `src/components/`
- `Button.jsx` - Pre-configured buttons
- `Icon.jsx` - Material Icons Outlined wrapper
- `Card.jsx` - Consistent card styling
- `PlayerAvatar.jsx` - Player photos with initials fallback
- `LogoImage.jsx` - Team/organization logos
- `MainNavigation.jsx` - Sidebar navigation

## 📝 Quick Reference

### Import Components
```jsx
import { Button, Icon, Card, PlayerAvatar, LogoImage } from './components'
```

### Use Team Logos
```jsx
<LogoImage type="team" logoId="arsenal" league="premier-league" height={40} />
<LogoImage type="team" logoId="lakers" league="nba" height={40} />
```

### Player Avatars
```jsx
<PlayerAvatar playerId="123" playerName="John Smith" size="medium" />
// Shows initials "JS" if no photo available
```

## ✅ Validation Commands

```bash
# Full validation (recommended)
npm run validate-design-system

# Quick checks
npm run lint              # JavaScript/React
npm run lint:css          # CSS/styling
npm run lint:fix          # Auto-fix issues
```

## 🔧 Development Tools

### ✅ ESLint Rules (Implemented)
Our custom ESLint plugin automatically enforces design system compliance:

- **`design-system/no-hardcoded-colors`**: Detects hardcoded hex colors and suggests design tokens
- **`design-system/button-variant-compliance`**: Enforces filled button variants only
- **`design-system/icon-type-compliance`**: Ensures only Material Icons Outlined are used
- **`design-system/text-casing-compliance`**: Warns about Title Case and UPPERCASE text

**Usage**: Run `npm run lint` to check JavaScript/React code compliance.

### ✅ CSS Linting (Implemented)
Our Stylelint plugin prevents CSS design violations:

- **`design-system/no-hardcoded-colors`**: Blocks hardcoded hex, RGB, and HSL colors
- **`design-system/use-design-tokens`**: Requires CSS custom properties for color values
- **`design-system/font-usage`**: Enforces Open Sans font family usage
- **Built-in rules**: Prevents `rgb()`, `rgba()`, `hsl()`, and `hsla()` functions

**Usage**: Run `npm run lint:css` to check CSS code compliance.

### ✅ Pre-commit Hooks (Implemented)
Automatic validation runs before every commit:

- **JavaScript/React validation**: ESLint with design system rules
- **CSS validation**: Stylelint with custom design rules
- **Hardcoded color detection**: Grep-based search for hex colors
- **Button variant checking**: Detects outlined/text button usage
- **Icon usage validation**: Ensures Outlined Material Icons only
- **Design token verification**: Confirms required tokens exist

**Usage**: Hooks run automatically on `git commit`, or manually with `npm run validate-design-system`.

### 🎯 Validation Commands

```bash
# Full design system validation
npm run validate-design-system

# Quick lint checks only  
npm run validate-quick

# Individual checks
npm run lint              # JavaScript/React
npm run lint:css          # CSS/styling
npm run lint:fix          # Auto-fix JS issues
npm run lint:css:fix      # Auto-fix CSS issues
```

## 📝 Common Fixes

**When validation fails:**

```bash
# Color issues
- color: #3B4960;               
+ color: var(--color-primary);

# Button issues
- <Button variant="outlined">   
+ <Button variant="contained">  

# Icon issues
- import { Dashboard }           
+ import { DashboardOutlined }   

# Text casing
- "Add Athlete"                 
+ "Add athlete"                 
```

**Files that auto-fix violations:**
- `.husky/pre-commit` - Blocks commits with violations
- `eslint-plugin-design-system/` - Custom ESLint rules
- `stylelint-plugin-design-system/` - Custom CSS rules