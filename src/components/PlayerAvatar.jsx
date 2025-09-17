import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { getPlayerImage, generateInitialsImage } from '../utils/assetManager'
import '../styles/design-tokens.css'

/**
 * Player Avatar Component with automatic fallback to initials
 * 
 * Handles missing player images gracefully by showing initials
 * Follows Medinah design system for consistent styling
 */
function PlayerAvatar({ 
  playerId, 
  playerName = '', 
  size = 'medium', 
  className = '',
  showTooltip = false,
  ...props 
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Size configurations
  const sizeConfig = {
    small: { size: 32, fontSize: '12px' },
    medium: { size: 40, fontSize: '14px' },
    large: { size: 64, fontSize: '20px' },
    xlarge: { size: 96, fontSize: '28px' }
  }

  const config = sizeConfig[size] || sizeConfig.medium
  
  // Get image source
  const imageSrc = getPlayerImage(playerId, playerName)
  const fallbackSrc = generateInitialsImage(
    playerName, 
    config.size * 2, // Higher resolution for sharp display
    'var(--color-primary)', 
    '#ffffff'
  )

  const handleImageError = () => {
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const avatarClasses = [
    'player-avatar',
    `player-avatar--${size}`,
    className
  ].filter(Boolean).join(' ')

  const avatarStyles = {
    width: config.size,
    height: config.size,
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    fontSize: config.fontSize,
    fontWeight: 'var(--font-weight-semibold)',
    fontFamily: 'var(--font-family-primary)',
    position: 'relative',
    flexShrink: 0
  }

  // Show initials if no player ID or image failed to load
  if (!playerId || imageError) {
    const initials = playerName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

    return (
      <div 
        className={avatarClasses}
        style={avatarStyles}
        title={showTooltip ? playerName : undefined}
        {...props}
      >
        {initials}
      </div>
    )
  }

  return (
    <div 
      className={avatarClasses}
      style={avatarStyles}
      title={showTooltip ? playerName : undefined}
      {...props}
    >
      <img
        src={imageSrc}
        alt={playerName}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      />
      {!imageLoaded && !imageError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-background-tertiary)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            ...
          </span>
        </div>
      )}
    </div>
  )
}

PlayerAvatar.propTypes = {
  playerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  playerName: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  className: PropTypes.string,
  showTooltip: PropTypes.bool
}

export default PlayerAvatar