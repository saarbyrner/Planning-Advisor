import React from 'react'
import PropTypes from 'prop-types'
import '../styles/design-tokens.css'

/**
 * Medinah Design System Button Component
 * 
 * Always uses filled variant, small size, and sentence case text
 * Adheres to Medinah brand guidelines automatically
 */
function MedinahButton({ 
  children, 
  variant = 'primary', 
  size = 'small', 
  disabled = false, 
  onClick, 
  type = 'button',
  className = '',
  ...props 
}) {
  const baseClass = 'btn'
  const variantClass = `btn-${variant}`
  const sizeClass = size === 'small' ? 'btn-small' : ''
  
  const buttonClasses = [baseClass, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

MedinahButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['small', 'medium']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string
}

export default MedinahButton