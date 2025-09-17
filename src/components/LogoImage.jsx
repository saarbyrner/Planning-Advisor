import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { getOrganizationLogo, getTeamLogo } from '../utils/assetManager'
import '../styles/design-tokens.css'

/**
 * Logo Image Component with fallback handling
 * 
 * Displays organization or team logos with proper fallbacks
 * Maintains aspect ratio and provides loading states
 */
function LogoImage({ 
  type = 'organization',
  logoId = 'organization-logo',
  league = 'premier-league',
  alt = '',
  width = 'auto',
  height = 32,
  className = '',
  showFallback = true,
  ...props 
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Get appropriate logo source
  const getLogoSrc = () => {
    switch (type) {
      case 'team':
        return getTeamLogo(logoId, league)
      case 'organization':
      default:
        return getOrganizationLogo(logoId)
    }
  }

  const logoSrc = getLogoSrc()

  const handleImageError = () => {
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const logoClasses = [
    'logo-image',
    `logo-image--${type}`,
    className
  ].filter(Boolean).join(' ')

  const containerStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    height: height,
    position: 'relative'
  }

  const imageStyles = {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    opacity: imageLoaded ? 1 : 0,
    transition: 'opacity 0.2s ease'
  }

  // Fallback placeholder
  const renderFallback = () => {
    if (!showFallback) return null

    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-background-tertiary)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--color-border-primary)'
      }}>
        <span style={{
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          fontWeight: 'var(--font-weight-medium)',
          textAlign: 'center',
          padding: '4px'
        }}>
          {type === 'team' ? 'TEAM' : 'LOGO'}
        </span>
      </div>
    )
  }

  // Loading placeholder
  const renderLoading = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background-tertiary)',
      borderRadius: 'var(--radius-sm)'
    }}>
      <span style={{ 
        fontSize: '10px', 
        color: 'var(--color-text-muted)' 
      }}>
        ...
      </span>
    </div>
  )

  return (
    <div 
      className={logoClasses}
      style={containerStyles}
      {...props}
    >
      {imageError ? (
        renderFallback()
      ) : (
        <>
          <img
            src={logoSrc}
            alt={alt || `${type} logo`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={imageStyles}
          />
          {!imageLoaded && renderLoading()}
        </>
      )}
    </div>
  )
}

LogoImage.propTypes = {
  type: PropTypes.oneOf(['organization', 'team']),
  logoId: PropTypes.string,
  league: PropTypes.string,
  alt: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  showFallback: PropTypes.bool
}

export default LogoImage