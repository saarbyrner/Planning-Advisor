import React, { useState } from 'react'
import { Box, Typography, Paper, Alert, Snackbar } from '@mui/material'
import { AthleteDataGrid } from '../components'
import athletesData from '../data/athletes.json'
import '../styles/design-tokens.css'

/**
 * Athletes page with comprehensive DataGrid
 * Displays all athletes with premium features like filtering, grouping, and export
 */
function Athletes() {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  const handleBulkAction = (action, selectedRows) => {
    const selectedAthletes = athletesData.filter(athlete => selectedRows.includes(athlete.id))
    const count = selectedAthletes.length
    
    let message = ''
    let severity = 'info'
    
    switch (action) {
      case 'view':
        message = `Viewing ${count} selected athlete${count > 1 ? 's' : ''}`
        break
      case 'email':
        message = `Sending email to ${count} athlete${count > 1 ? 's' : ''}`
        severity = 'success'
        break
      case 'group':
        message = `Creating group from ${count} athlete${count > 1 ? 's' : ''}`
        severity = 'success'
        break
      case 'export':
        message = `Exporting ${count} athlete${count > 1 ? 's' : ''} to spreadsheet`
        severity = 'success'
        break
      case 'assessment':
        message = `Scheduling assessment for ${count} athlete${count > 1 ? 's' : ''}`
        severity = 'success'
        break
      case 'remove':
        message = `Removing ${count} athlete${count > 1 ? 's' : ''} from system`
        severity = 'warning'
        break
      default:
        message = `Unknown action: ${action}`
        severity = 'error'
    }
    
    setSnackbar({ open: true, message, severity })
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0}
        sx={{
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-primary)',
          overflow: 'hidden'
        }}
      >
        <AthleteDataGrid 
          data={athletesData}
          height={700}
          showToolbar={true}
          groupingEnabled={true}
          onBulkAction={handleBulkAction}
        />
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Athletes