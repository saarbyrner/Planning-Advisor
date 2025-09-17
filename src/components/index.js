// Design System Components
// Import these components instead of creating custom ones to ensure design compliance

export { default as Button } from './Button'
export { default as Icon } from './Icon'
export { default as Card } from './Card'
export { default as StatusChip } from './StatusChip'
export { default as Layout } from './Layout'
export { default as LayoutWithMainNav } from './LayoutWithMainNav'
export { default as PlayerAvatar } from './PlayerAvatar'
export { default as LogoImage } from './LogoImage'
export { default as MainNavigation } from './MainNavigation'
export { default as AthleteDataGrid } from './AthleteDataGrid'

// Usage Examples:
// import { Button, Icon, Card, PlayerAvatar, LogoImage } from '../components'
// 
// <Button variant="primary" size="small">Add athlete</Button>
// <Icon icon="dashboard" size="medium" />
// <Card title="Athletes">Card content</Card>
// <PlayerAvatar playerId="123" playerName="John Smith" size="medium" />
// <LogoImage type="team" logoId="arsenal" league="premier-league" height={40} />