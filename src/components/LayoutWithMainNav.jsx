import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Select,
  CssBaseline,
  FormControl,
  InputLabel,
  Button
} from '@mui/material'
import { 
  Notifications,
  KeyboardArrowDownOutlined
} from '@mui/icons-material'
import MainNavigation from './MainNavigation'
import KitmanLogo from '/public/assets/logos/Kitman Labs base.png'
import '../styles/design-tokens.css'

// Mock current user data
const currentUser = {
  name: 'Dr. Sarah Mitchell',
  email: 'sarah.mitchell@example.com',
  role: 'Sports Medicine Director',
  avatar: '👩‍⚕️'
}

// Mock squad data
const availableSquads = [
  { id: 1, name: 'First Team', short: 'FT' },
  { id: 2, name: 'Reserve Team', short: 'RES' },
  { id: 3, name: 'Academy U21', short: 'U21' },
  { id: 4, name: 'Academy U18', short: 'U18' }
]

// Page titles mapping
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/medical': 'Medical',
  '/analysis': 'Analysis',
  '/athlete': 'Athletes',
  '/workloads': 'Workload',
  '/questionnaires': 'Forms',
  '/planning': 'Calendar',
  '/activity': 'Activity log',
  '/settings': 'Admin',
  '/help': 'Help',
  '/plan-management': 'Planning Advisor'
}

function MedinahLayoutWithMainNav({ children, headerControls }) {
  const location = useLocation()
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [currentSquad, setCurrentSquad] = useState(availableSquads[0])
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)

  const getPageTitle = () => {
    return pageTitles[location.pathname] || 'Dashboard'
  }

  const handleNavToggle = () => {
    setIsNavOpen(!isNavOpen)
  }

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleSquadChange = (event) => {
    const squad = availableSquads.find(s => s.id === event.target.value)
    setCurrentSquad(squad)
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', gap: 0, height: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Main Navigation */}
      <MainNavigation 
        isOpen={isNavOpen}
        onToggle={handleNavToggle}
        variant="permanent"
      />

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Top App Bar */}
        <AppBar 
          position="sticky" 
          elevation={1}
            sx={{ 
              bgcolor: 'var(--color-white)',
              color: 'var(--color-text-primary)',
              borderBottom: '1px solid var(--color-border-primary)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Left Side - Title Only */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="h6" 
                component="h1"
                sx={{ 
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  textTransform: 'none'
                }}
              >
                {getPageTitle()}
              </Typography>
            </Box>

            {/* Right Side Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Active Roster Selector */}
              <Select
                value={currentSquad.id}
                onChange={handleSquadChange}
                displayEmpty
                size="small"
                endAdornment={<KeyboardArrowDownOutlined sx={{ fontSize: 16 }} />}
                sx={{ 
                  fontSize: '14px',
                  minWidth: 140,
                  backgroundColor: '#ffffff',
                  border: 'none',
                  boxShadow: 'none',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '& .MuiSelect-select': {
                    py: 1,
                    px: 2
                  }
                }}
              >
                {availableSquads.map(squad => (
                  <MenuItem key={squad.id} value={squad.id}>
                    {squad.name}
                  </MenuItem>
                ))}
              </Select>

              {/* User Menu */}
              <Avatar 
                onClick={handleUserMenuOpen}
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: 'var(--color-primary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'var(--color-primary-hover)'
                  }
                }}
              >
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </Avatar>

              {/* User Dropdown Menu */}
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleUserMenuClose}>Profile</MenuItem>
                <MenuItem onClick={handleUserMenuClose}>Settings</MenuItem>
                <MenuItem onClick={handleUserMenuClose}>Logout</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
          
          {/* Header Controls - Full Width */}
            {headerControls && (
              <Box sx={{ 
                px: 3, 
                py: 2, 
                borderTop: '1px solid var(--color-border-primary)',
                bgcolor: 'var(--color-white)'
              }}>
                {headerControls}
              </Box>
            )}
        </AppBar>

        {/* Page Content */}
        <Box 
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            p: 3,
            bgcolor: 'var(--color-background-secondary)'
          }}
        >
          <Box
            sx={{
              width: '100%',
              boxSizing: 'border-box',
              px: 0,
              pt: 'var(--spacing-md)',
              pb: 'var(--spacing-lg)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box
              sx={(theme) => {
                const isTeamPlanning = location.pathname === '/team-planning';
                return {
                  width: '100%',
                  backgroundColor: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-primary)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                  p: (isTeamPlanning || location.pathname === '/plan-management') ? 0 : 'var(--spacing-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                };
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
    </>
  )
}

export default MedinahLayoutWithMainNav