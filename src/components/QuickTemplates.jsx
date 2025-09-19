import { 
  Box, 
  Card, 
  Typography, 
  Button,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import { 
  SportsSoccerOutlined,
  TrendingUpOutlined,
  ScheduleOutlined
} from '@mui/icons-material';

const QuickTemplates = ({ onSelectTemplate }) => {
  const templates = [
    {
      id: 'high-pressing',
      name: 'High Pressing Focus',
      description: 'Intensive pressing and ball recovery training',
      icon: <SportsSoccerOutlined />,
      color: '#d32f2f',
      config: {
        sessionsPerWeek: 4,
        sessionDuration: 60,
        planDuration: 5,
        primaryFocus: 'pressing',
        secondaryFocus: 'transition',
        tertiaryFocus: 'defensive-shape',
        highIntensitySessions: 3,
        mediumIntensitySessions: 1
      }
    },
    {
      id: 'transition-heavy',
      name: 'Transition Heavy',
      description: 'Quick switches between attack and defense',
      icon: <TrendingUpOutlined />,
      color: '#ed6c02',
      config: {
        sessionsPerWeek: 4,
        sessionDuration: 60,
        planDuration: 5,
        primaryFocus: 'transition',
        secondaryFocus: 'pressing',
        tertiaryFocus: 'attacking-patterns',
        highIntensitySessions: 2,
        mediumIntensitySessions: 2
      }
    },
    {
      id: 'balanced-development',
      name: 'Balanced Development',
      description: 'Well-rounded training across all areas',
      icon: <ScheduleOutlined />,
      color: '#2e7d32',
      config: {
        sessionsPerWeek: 4,
        sessionDuration: 60,
        planDuration: 5,
        primaryFocus: 'possession',
        secondaryFocus: 'attacking-patterns',
        tertiaryFocus: 'defensive-shape',
        highIntensitySessions: 2,
        mediumIntensitySessions: 2
      }
    },
    {
      id: 'final-third-focus',
      name: 'Final Third Focus',
      description: 'Crossing, finishing, and goal creation',
      icon: <SportsSoccerOutlined />,
      color: '#1976d2',
      config: {
        sessionsPerWeek: 4,
        sessionDuration: 60,
        planDuration: 5,
        primaryFocus: 'final-delivery',
        secondaryFocus: 'attacking-patterns',
        tertiaryFocus: 'possession',
        highIntensitySessions: 2,
        mediumIntensitySessions: 2
      }
    }
  ];

  const handleTemplateSelect = (template) => {
    onSelectTemplate(template.config);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" sx={{ 
        textAlign: 'center',
        mb: 3,
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)'
      }}>
        Quick Start Templates
      </Typography>
      <Typography variant="body1" sx={{ 
        textAlign: 'center',
        mb: 4,
        color: 'var(--color-text-secondary)'
      }}>
        Choose a template to get started quickly, or create a custom plan
      </Typography>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} key={template.id}>
            <Card sx={{ 
              p: 3,
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '2px solid transparent',
              '&:hover': {
                borderColor: template.color,
                transform: 'translateY(-2px)',
                boxShadow: 'var(--shadow-lg)'
              }
            }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  backgroundColor: template.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white'
                }}>
                  {template.icon}
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  mb: 1
                }}>
                  {template.name}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'var(--color-text-secondary)',
                  mb: 2
                }}>
                  {template.description}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ 
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 'var(--font-weight-medium)',
                  letterSpacing: '0.5px'
                }}>
                  Focus Areas
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip 
                    label={template.config.primaryFocus.replace('-', ' ')}
                    size="small"
                    sx={{ 
                      backgroundColor: template.color,
                      color: 'white',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  />
                  <Chip 
                    label={template.config.secondaryFocus.replace('-', ' ')}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: template.color,
                      color: template.color
                    }}
                  />
                  <Chip 
                    label={template.config.tertiaryFocus.replace('-', ' ')}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: 'var(--color-border-primary)',
                      color: 'var(--color-text-secondary)'
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ 
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 'var(--font-weight-medium)',
                  letterSpacing: '0.5px'
                }}>
                  Training Schedule
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip 
                    label={`${template.config.sessionsPerWeek} sessions/week`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    label={`${template.config.sessionDuration} min`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    label={`${template.config.planDuration} weeks`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => handleTemplateSelect(template)}
                sx={{
                  backgroundColor: template.color,
                  color: 'white',
                  '&:hover': { 
                    backgroundColor: template.color,
                    opacity: 0.9
                  },
                  textTransform: 'none',
                  fontWeight: 'var(--font-weight-medium)',
                  py: 1.5
                }}
              >
                Use This Template
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuickTemplates;
