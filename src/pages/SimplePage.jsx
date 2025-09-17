import { Box, Typography } from '@mui/material'

function SimplePage({ pageName }) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary">
        {pageName}
      </Typography>
    </Box>
  )
}

export default SimplePage