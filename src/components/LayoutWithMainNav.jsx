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
  CssBaseline
} from '@mui/material'
import { 
  Notifications
} from '@mui/icons-material'
import MainNavigation from './MainNavigation'
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
  '/help': 'Help'
}

function MedinahLayoutWithMainNav({ children }) {
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
            bgcolor: '#ffffff',
            color: '#333333',
            borderBottom: '1px solid #e0e0e0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Page Title */}
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

            {/* Right Side Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Squad Selector */}
              <Select
                value={currentSquad.id}
                onChange={handleSquadChange}
                displayEmpty
                size="small"
                sx={{ 
                  fontSize: '14px',
                  minWidth: 160,
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

              {/* Notifications */}
              <IconButton 
                sx={{ 
                  color: 'var(--color-text-secondary)',
                  '&:hover': { 
                    bgcolor: 'rgba(0, 0, 0, 0.04)' 
                  }
                }}
              >
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

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
          {children}
        </Box>
      </Box>
    </Box>
    </>
  )
}

export default MedinahLayoutWithMainNav