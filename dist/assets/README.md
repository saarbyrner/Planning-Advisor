# Assets Directory

This directory contains all images and media assets for the Medinah design prototype.

## 📁 Directory Structure

```
assets/
├── players/          # Player headshots and photos
├── logos/           # Organization and team logos
├── badges/          # Achievement badges and icons
├── teams/           # Team crests and emblems
└── README.md        # This file
```

## 🖼️ Image Guidelines

### **File Naming Convention**
- Use lowercase with hyphens: `player-name.jpg`
- Include player ID when possible: `player-123-john-smith.jpg`
- Logos: `organization-logo.png`, `team-logo-main.svg`

### **Image Specifications**
- **Player photos**: 400x400px, JPG format, square aspect ratio
- **Logos**: SVG preferred, PNG as fallback, transparent background
- **Team badges**: 200x200px, PNG/SVG, square format
- **File size**: Keep under 500KB for optimal loading

### **Recommended Formats**
- **Photos**: JPG (better compression for photos)
- **Logos/Icons**: SVG (scalable) or PNG (transparent background)
- **Badges**: PNG or SVG

## 📋 Usage Examples

### **In React Components**
```jsx
// Player images
<img src="/assets/players/john-smith.jpg" alt="John Smith" />

// Logos
<img src="/assets/logos/medinah-logo.svg" alt="Medinah Logo" />

// Team badges
<img src="/assets/teams/first-team-badge.png" alt="First Team" />
```

### **In CSS**
```css
.player-avatar {
  background-image: url('/assets/players/player-123.jpg');
}

.header-logo {
  background-image: url('/assets/logos/organization-logo.svg');
}
```

## 🎨 Asset Management

The prototype includes an asset management system that:
- Provides fallback placeholder images
- Handles missing images gracefully
- Maintains consistent aspect ratios
- Supports different image sizes

## 📝 Adding New Assets

1. **Add image files** to the appropriate directory
2. **Follow naming conventions** for consistency
3. **Update asset registry** if using the asset management system
4. **Test in prototype** to ensure proper loading

## 🔄 Placeholder System

When images are missing, the system automatically:
- Shows player initials for missing player photos
- Displays generic logos for missing team images
- Maintains proper layout with placeholder dimensions