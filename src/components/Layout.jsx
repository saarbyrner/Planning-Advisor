import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import LogoImage from './LogoImage'
import '../styles/design-tokens.css'

// Mock navigation items based on real Medinah structure
const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', section: 'main' },
  { name: 'Athletes', path: '/athlete', icon: 'person', section: 'main' },
  { name: 'Medical', path: '/medical', icon: 'local_hospital', section: 'main' },
  { name: 'Workloads', path: '/workloads', icon: 'fitness_center', section: 'main' },
  { name: 'Questionnaires', path: '/questionnaires', icon: 'assignment', section: 'main' },
  { name: 'Analysis', path: '/analysis', icon: 'analytics', section: 'analysis' },
  { name: 'Planning', path: '/planning', icon: 'event', section: 'planning' },
  { name: 'Settings', path: '/settings', icon: 'settings', section: 'settings' }
]

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

function MedinahLayout({ children }) {
  const location = useLocation()
  const [currentSquad, setCurrentSquad] = useState(availableSquads[0])
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)

  const getPageTitle = () => {
    const currentPath = location.pathname
    const currentItem = navigationItems.find(item => item.path === currentPath)
    return currentItem ? currentItem.name : 'Dashboard'
  }

  return (
    <div className="app-layout">
      {/* Loading Screen */}
      <div className="loading-screen" style={{display: 'none'}}>
        <h1>Fetching Data</h1>
      </div>

      {/* Main Container */}
      <div className="main" id="root">
        {/* Side Navigation */}
        <nav className={`main-nav ${isNavCollapsed ? 'collapsed' : ''}`}>
          <div className="nav-header">
            <div className="nav-logo">
              <LogoImage 
                type="organization" 
                logoId="organization-logo" 
                alt="Medinah Logo" 
                height={32}
                width={120}
              />
            </div>
            <button 
              className="nav-toggle"
              onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>

          <div className="nav-content">
            {/* Navigation Items */}
            <ul className="nav-items">
              {navigationItems.map(item => (
                <li key={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                  <Link to={item.path} className="nav-link">
                    <span className="nav-icon material-icons-outlined">{item.icon}</span>
                    <span className="nav-text">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="main__inner">
          {/* App Header */}
          <header className="app-header">
            <div className="app-header__left">
              <h1 className="page-title">{getPageTitle()}</h1>
            </div>
            
            <div className="app-header__right">
              <div className="header-actions">
                {/* Squad Selector */}
                <div className="header-squad-selector">
                  <label>Squad:</label>
                  <select 
                    value={currentSquad.id} 
                    onChange={(e) => setCurrentSquad(availableSquads.find(s => s.id === parseInt(e.target.value)))}
                  >
                    {availableSquads.map(squad => (
                      <option key={squad.id} value={squad.id}>{squad.name}</option>
                    ))}
                  </select>
                </div>
                
                <button className="header-btn notifications">
                  <span className="notification-badge">3</span>
                  <span className="material-icons-outlined">notifications</span>
                </button>
                
                <div className="user-menu">
                  <div className="user-avatar">
                    <span className="avatar-icon">{currentUser.avatar}</span>
                    <div className="user-info">
                      <span className="user-name">{currentUser.name}</span>
                      <span className="user-role">{currentUser.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default MedinahLayout