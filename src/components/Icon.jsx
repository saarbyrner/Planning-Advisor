import React from 'react'
import PropTypes from 'prop-types'

/**
 * Medinah Design System Icon Component
 * 
 * Always uses Material Icons Outlined
 * Ensures consistent icon usage across the design system
 */
function MedinahIcon({ icon, size = 'medium', className = '', ...props }) {
  const sizeClass = {
    small: 'icon-small',
    medium: 'icon-medium', 
    large: 'icon-large'
  }[size]

  const iconClasses = ['material-icons-outlined', sizeClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={iconClasses} {...props}>
      {icon}
    </span>
  )
}

MedinahIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
}

export default MedinahIcon