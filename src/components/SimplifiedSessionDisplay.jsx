import { 
  Box, 
  Card, 
  Typography, 
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ExpandMoreOutlined,
  SportsSoccerOutlined,
  ScheduleOutlined,
  TrendingUpOutlined,
  EditOutlined,
  RefreshOutlined
} from '@mui/icons-material';

const SimplifiedSessionDisplay = ({ 
  sessions = [], 
  selectedSession = 0, 
  onSessionSelect,
  onRegenerateSession,
  regenerating = false
}) => {
  if (!sessions || sessions.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'var(--color-text-secondary)' }}>
          No sessions available. Generate a plan to see your training sessions.
        </Typography>
      </Card>
    );
  }

  const currentSession = sessions[selectedSession];
  if (!currentSession) return null;

  const getIntensityColor = (intensity) => {
    switch (intensity?.toLowerCase()) {
      case 'high': return '#d32f2f';
      case 'medium': return '#ed6c02';
      case 'low': return '#2e7d32';
      case 'match': return '#7b1fa2';
      default: return '#666';
    }
  };

  const getIntensityLabel = (intensity) => {
    switch (intensity?.toLowerCase()) {
      case 'high': return 'High Intensity';
      case 'medium': return 'Medium Intensity';
      case 'low': return 'Low Intensity';
      case 'match': return 'Match Day';
      default: return 'Training';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getSessionSummary = (session) => {
    if (session.overall_load === 'Match') {
      return "Match day with activation and tactical preparation";
    }
    
    const focusAreas = session.principles_applied?.slice(0, 2) || [];
    const focusText = focusAreas.length > 0 
      ? `Focus on ${focusAreas.join(' and ').toLowerCase()}`
      : 'General training session';
    
    return `${getIntensityLabel(session.overall_load)} session - ${focusText}`;
  };

  const getPhaseSummary = (phase) => {
    const drillCount = phase.drills?.length || 0;
    const duration = phase.duration || 0;
    
    if (drillCount === 0) {
      return `${phase.name} - No drills yet`;
    }
    
    return `${phase.name} - ${drillCount} drill${drillCount > 1 ? 's' : ''} (${duration} min)`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Session Header */}
      <Card sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-primary)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              mb: 1
            }}>
              {currentSession.name || `Session ${selectedSession + 1}`}
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'var(--color-text-secondary)',
              mb: 2
            }}>
              {formatDate(currentSession.date)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                label={getIntensityLabel(currentSession.overall_load)}
                sx={{ 
                  backgroundColor: getIntensityColor(currentSession.overall_load),
                  color: 'white',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              />
              {currentSession.drills_generated && (
                <Chip 
                  label="Drills Ready"
                  color="success"
                  size="small"
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Regenerate this session">
              <IconButton 
                onClick={() => onRegenerateSession(selectedSession)}
                disabled={regenerating}
                color="primary"
              >
                <RefreshOutlined />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Session Summary */}
        <Paper sx={{ 
          p: 2, 
          backgroundColor: 'var(--color-background-secondary)',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ 
            mb: 1,
            color: 'var(--color-text-primary)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            What you'll work on today:
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6
          }}>
            {getSessionSummary(currentSession)}
          </Typography>
          {currentSession.principles_applied && currentSession.principles_applied.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ 
                mb: 1,
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Key focus areas:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {currentSession.principles_applied.slice(0, 4).map((principle, index) => (
                  <Chip 
                    key={index}
                    label={principle}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Card>

      {/* Session Phases */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {currentSession.phases?.map((phase, index) => (
          <Accordion 
            key={index}
            sx={{ 
              border: '1px solid var(--color-border-primary)',
              borderRadius: 'var(--radius-md) !important',
              '&:before': { display: 'none' },
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreOutlined />}
              sx={{ 
                backgroundColor: 'var(--color-background-primary)',
                borderRadius: 'var(--radius-md)',
                '&.Mui-expanded': {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  backgroundColor: getIntensityColor(phase.target_intensity),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  {index + 1}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)'
                  }}>
                    {phase.name}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'var(--color-text-secondary)'
                  }}>
                    {getPhaseSummary(phase)}
                  </Typography>
                </Box>
                {phase.target_intensity && (
                  <Chip 
                    label={phase.target_intensity}
                    size="small"
                    sx={{ 
                      backgroundColor: getIntensityColor(phase.target_intensity),
                      color: 'white'
                    }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ 
              backgroundColor: 'var(--color-background-secondary)',
              borderTop: '1px solid var(--color-border-primary)'
            }}>
              {phase.focus && (
                <Typography variant="body2" sx={{ 
                  mb: 2,
                  color: 'var(--color-text-secondary)',
                  fontStyle: 'italic'
                }}>
                  {phase.focus}
                </Typography>
              )}
              
              {phase.drills && phase.drills.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {phase.drills.map((drill, drillIndex) => (
                    <Paper 
                      key={drillIndex}
                      sx={{ 
                        p: 2, 
                        backgroundColor: 'var(--color-background-primary)',
                        border: '1px solid var(--color-border-primary)'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-primary)'
                        }}>
                          {drill.name}
                        </Typography>
                        <Chip 
                          label={`${drill.duration} min`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ 
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5
                      }}>
                        {drill.instructions}
                      </Typography>
                      {drill.equipment && (
                        <Typography variant="caption" sx={{ 
                          display: 'block',
                          mt: 1,
                          color: 'var(--color-text-muted)'
                        }}>
                          Equipment: {drill.equipment}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  backgroundColor: 'var(--color-background-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px dashed var(--color-border-primary)'
                }}>
                  <Typography variant="body2" sx={{ 
                    color: 'var(--color-text-secondary)',
                    mb: 1
                  }}>
                    No drills generated yet
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => onRegenerateSession(selectedSession)}
                    disabled={regenerating}
                  >
                    Generate Drills
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default SimplifiedSessionDisplay;
