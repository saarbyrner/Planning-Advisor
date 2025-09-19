import { 
  Box, 
  Card, 
  Typography, 
  LinearProgress, 
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  TrendingUpOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined
} from '@mui/icons-material';
import { useState } from 'react';

const PrincipleBreakdown = ({ 
  principles = {}, 
  onAdjustPercentages, 
  editable = true,
  expectedImprovements = {}
}) => {
  const [editing, setEditing] = useState(false);
  const [tempPercentages, setTempPercentages] = useState({});

  // Convert principles object to array with percentages
  const principleArray = Object.entries(principles).map(([key, value]) => ({
    name: key,
    percentage: value,
    color: getPrincipleColor(key),
    description: getPrincipleDescription(key)
  }));

  function getPrincipleColor(principle) {
    const colors = {
      'pressing': '#d32f2f',
      'transition': '#ed6c02', 
      'final-delivery': '#2e7d32',
      'possession': '#1976d2',
      'defensive-shape': '#7b1fa2',
      'attacking-patterns': '#f57c00'
    };
    return colors[principle] || '#666';
  }

  function getPrincipleDescription(principle) {
    const descriptions = {
      'pressing': 'High-intensity defensive pressure and ball recovery',
      'transition': 'Quick switches between attack and defense',
      'final-delivery': 'Crossing, finishing, and final third play',
      'possession': 'Ball retention and circulation',
      'defensive-shape': 'Organized defensive structure and positioning',
      'attacking-patterns': 'Build-up play and goal creation'
    };
    return descriptions[principle] || '';
  }

  const handlePercentageChange = (principle, newPercentage) => {
    setTempPercentages(prev => ({
      ...prev,
      [principle]: Math.max(0, Math.min(100, newPercentage))
    }));
  };

  const handleSave = () => {
    if (onAdjustPercentages) {
      onAdjustPercentages(tempPercentages);
    }
    setEditing(false);
    setTempPercentages({});
  };

  const handleCancel = () => {
    setEditing(false);
    setTempPercentages({});
  };

  const totalPercentage = Object.values(editing ? tempPercentages : principles).reduce((sum, val) => sum + (val || 0), 0);
  const isValid = Math.abs(totalPercentage - 100) < 1; // Allow 1% tolerance

  return (
    <Card sx={{ 
      p: 3, 
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <TrendingUpOutlined />
          Plan Focus Breakdown
        </Typography>
        {editable && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editing ? (
              <>
                <Tooltip title="Save changes">
                  <IconButton 
                    onClick={handleSave}
                    disabled={!isValid}
                    color="primary"
                    size="small"
                  >
                    <CheckOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton 
                    onClick={handleCancel}
                    color="error"
                    size="small"
                  >
                    <CloseOutlined />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Adjust percentages">
                <IconButton 
                  onClick={() => setEditing(true)}
                  color="primary"
                  size="small"
                >
                  <EditOutlined />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Percentage Bars */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            {principleArray.map((principle, index) => {
              const currentPercentage = editing ? (tempPercentages[principle.name] || principle.percentage) : principle.percentage;
              return (
                <Box key={principle.name} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)',
                      textTransform: 'capitalize'
                    }}>
                      {principle.name.replace('-', ' ')}
                    </Typography>
                    {editing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                          type="number"
                          value={currentPercentage}
                          onChange={(e) => handlePercentageChange(principle.name, parseFloat(e.target.value))}
                          style={{
                            width: '60px',
                            padding: '4px 8px',
                            border: '1px solid var(--color-border-primary)',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}
                          min="0"
                          max="100"
                          step="5"
                        />
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                          %
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'var(--font-weight-semibold)',
                        color: principle.color
                      }}>
                        {currentPercentage}%
                      </Typography>
                    )}
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={currentPercentage}
                    sx={{
                      height: 12,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-background-secondary)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: principle.color,
                        borderRadius: 'var(--radius-sm)'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    color: 'var(--color-text-secondary)',
                    mt: 0.5,
                    display: 'block'
                  }}>
                    {principle.description}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          
          {editing && (
            <Paper sx={{ 
              p: 2, 
              backgroundColor: totalPercentage === 100 ? 'var(--color-success-light)' : 'var(--color-warning-light)',
              border: `1px solid ${totalPercentage === 100 ? 'var(--color-success)' : 'var(--color-warning)'}`
            }}>
              <Typography variant="body2" sx={{ 
                color: totalPercentage === 100 ? 'var(--color-success-dark)' : 'var(--color-warning-dark)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Total: {totalPercentage.toFixed(1)}% 
                {totalPercentage === 100 ? ' ✓ Perfect!' : ' (Must equal 100%)'}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Expected Outcomes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            backgroundColor: 'var(--color-background-secondary)',
            height: 'fit-content'
          }}>
            <Typography variant="h6" sx={{ 
              mb: 2,
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Expected Improvements
            </Typography>
            {Object.keys(expectedImprovements).length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(expectedImprovements).map(([principle, improvement]) => (
                  <Box key={principle} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={`+${improvement}%`}
                      size="small"
                      sx={{ 
                        backgroundColor: getPrincipleColor(principle),
                        color: 'white',
                        fontWeight: 'var(--font-weight-semibold)'
                      }}
                    />
                    <Typography variant="body2" sx={{ 
                      color: 'var(--color-text-secondary)',
                      textTransform: 'capitalize'
                    }}>
                      {principle.replace('-', ' ')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ 
                color: 'var(--color-text-secondary)',
                fontStyle: 'italic'
              }}>
                Generate a plan to see expected improvements based on your focus areas.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Card>
  );
};

export default PrincipleBreakdown;
