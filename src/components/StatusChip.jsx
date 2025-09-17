import React from 'react'
import PropTypes from 'prop-types'
import '../styles/design-tokens.css'

/**
 * Medinah Design System Status Chip Component
 * 
 * Pre-styled status chip with consistent colors and styling
 * Automatically applies correct status colors based on type
 */
function MedinahStatusChip({ status, type = 'default', className = '', ...props }) {
  const getStatusClass = () => {
    switch (type) {
      case 'success':
        return 'status-success'
      case 'error':
        return 'status-error'
      case 'warning':
        return 'status-warning'
      case 'primary':
        return 'status-primary'
      default:
        return 'status-default'
    }
  }

  const chipClasses = ['status-chip', getStatusClass(), className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={chipClasses} {...props}>
      {status}
    </div>
  )
}

MedinahStatusChip.propTypes = {
  status: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'primary', 'default']),
  className: PropTypes.string
}

export default MedinahStatusChip