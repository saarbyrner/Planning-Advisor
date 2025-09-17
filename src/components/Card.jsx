import React from 'react'
import PropTypes from 'prop-types'
import '../styles/design-tokens.css'

/**
 * Medinah Design System Card Component
 * 
 * Pre-styled card component that follows Medinah design guidelines
 * Includes consistent spacing, colors, and layout
 */
function MedinahCard({ title, children, className = '', ...props }) {
  const cardClasses = ['dashboard-card', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClasses} {...props}>
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

MedinahCard.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

export default MedinahCard