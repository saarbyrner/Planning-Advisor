import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Grid,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Slider
} from '@mui/material';
import { 
  SportsSoccerOutlined,
  ScheduleOutlined,
  TrendingUpOutlined,
  PlayArrowOutlined,
  AutoAwesomeOutlined,
  CalendarTodayOutlined
} from '@mui/icons-material';
import PlanSettingsForm from './PlanSettingsForm';
import principlesData from '../data/principles_of_play.json';

const SmartCoachInputForm = ({ onGeneratePlan, loading = false }) => {
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 weeks from now
    focusPercentages: {
      'pressing': 50,
      'transition': 30,
      'final-delivery': 20,
      'possession': 0,
      'defensive-shape': 0,
      'attacking-patterns': 0
    },
    sessionDuration: 90
  });

  // Plan settings state
  const [planSettings, setPlanSettings] = useState({
    variability: 'medium', // low | medium | high
    objective: '',
    generationMode: 'generative' // curated | hybrid | generative
  });

  // Focus principles state (separate from settings)
  const [selectedPrinciples, setSelectedPrinciples] = useState([]);

  const [aiSchedule, setAiSchedule] = useState(null);

  const focusOptions = [
    { value: 'pressing', label: 'Pressing', description: 'High-intensity defensive pressure' },
    { value: 'transition', label: 'Transition', description: 'Quick switches between attack and defense' },
    { value: 'final-delivery', label: 'Final Delivery', description: 'Crossing, finishing, and final third play' },
    { value: 'possession', label: 'Possession', description: 'Ball retention and circulation' },
    { value: 'defensive-shape', label: 'Defensive Shape', description: 'Organized defensive structure' },
    { value: 'attacking-patterns', label: 'Attacking Patterns', description: 'Build-up play and goal creation' }
  ];


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset AI schedule when inputs change
    setAiSchedule(null);
  };

  const handleFocusPercentageChange = (focusArea, newValue) => {
    setFormData(prev => {
      const newPercentages = { ...prev.focusPercentages, [focusArea]: newValue };
      
      // Normalize percentages to ensure they sum to 100
      const total = Object.values(newPercentages).reduce((sum, val) => sum + val, 0);
      if (total > 100) {
        // Scale down all values proportionally
        Object.keys(newPercentages).forEach(key => {
          newPercentages[key] = Math.round((newPercentages[key] / total) * 100);
        });
      }
      
      return {
        ...prev,
        focusPercentages: newPercentages
      };
    });
    setAiSchedule(null);
  };

  const handlePrincipleToggle = (principleName) => {
    setSelectedPrinciples(prev => {
      if (prev.includes(principleName)) {
        return prev.filter(name => name !== principleName);
      } else if (prev.length < 7) {
        return [...prev, principleName];
      }
      return prev;
    });
  };

  const generateAiSchedule = async () => {
    try {
      // AI determines optimal schedule based on plan requirements
      const schedule = await determineOptimalSchedule(formData);
      setAiSchedule(schedule);
    } catch (error) {
      console.error('Error generating AI schedule:', error);
    }
  };

  const determineOptimalSchedule = async (requirements) => {
    // AI determines optimal schedule based on plan requirements
    const schedule = {
      totalSessions: 0,
      intensityDistribution: { high: 0, medium: 0, low: 0 },
      rationale: ''
    };

    // Calculate duration from date range
    const startDate = new Date(requirements.startDate);
    const endDate = new Date(requirements.endDate);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const weeks = Math.ceil(daysDiff / 7);
    
    const baseSessionsPerWeek = 3; // Standard 3 sessions per week
    const totalSessions = weeks * baseSessionsPerWeek;
    
    schedule.totalSessions = totalSessions;
    schedule.rationale = `AI-generated ${weeks}-week plan (${daysDiff} days) with ${totalSessions} total sessions. Sessions are intelligently distributed for optimal learning and recovery.`;

    // Calculate intensity distribution based on focus areas
    const focusPercentages = requirements.focusPercentages || {};
    const pressingPercentage = focusPercentages.pressing || 0;
    const highIntensityRatio = pressingPercentage > 30 ? 0.4 : 0.3;
    const mediumIntensityRatio = 0.4;
    const lowIntensityRatio = 1 - highIntensityRatio - mediumIntensityRatio;

    schedule.intensityDistribution = {
      high: Math.round(totalSessions * highIntensityRatio),
      medium: Math.round(totalSessions * mediumIntensityRatio),
      low: Math.round(totalSessions * lowIntensityRatio)
    };

    return schedule;
  };

  const handleGenerate = () => {
    // Auto-generate AI schedule if not already done
    if (!aiSchedule) {
      generateAiSchedule().then(() => {
        // After generating schedule, proceed with plan generation
        const planData = {
          ...formData,
          aiSchedule: aiSchedule,
          startDate: formData.startDate,
          endDate: formData.endDate,
          planSettings: planSettings,
          selectedPrinciples: selectedPrinciples
        };
        onGeneratePlan(planData);
      });
    } else {
      const planData = {
        ...formData,
        aiSchedule: aiSchedule,
        startDate: formData.startDate,
        endDate: formData.endDate,
        planSettings: planSettings,
        selectedPrinciples: selectedPrinciples
      };
      onGeneratePlan(planData);
    }
  };

  const getFocusDescription = (focusValue) => {
    return focusOptions.find(opt => opt.value === focusValue)?.description || '';
  };

  const calculateDateRangeInfo = () => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const weeks = Math.ceil(daysDiff / 7);
    const days = daysDiff;
    
    return { days, weeks };
  };

  return (
    <Card sx={{ 
      p: 4, 
      maxWidth: 900, 
      mx: 'auto',
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <AutoAwesomeOutlined sx={{ fontSize: 48, color: 'var(--color-primary)', mb: 2 }} />
        <Typography variant="h6" sx={{ 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          mb: 1
        }}>
          AI-Powered Training Plan
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* Learning Focus */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: 'var(--color-background-secondary)' }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'var(--color-text-primary)'
            }}>
              <TrendingUpOutlined />
              Learning Focus Distribution
            </Typography>
            <Typography variant="body2" sx={{ 
              mb: 3, 
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic'
            }}>
              Adjust the sliders to set your training focus priorities. Total must equal 100%.
            </Typography>
            
            <Grid container spacing={3}>
              {focusOptions.map((option) => (
                <Grid item xs={12} sm={6} key={option.value}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                        textTransform: 'capitalize'
                      }}>
                        {option.label}
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-primary)',
                        minWidth: '40px',
                        textAlign: 'right'
                      }}>
                        {formData.focusPercentages[option.value]}%
                      </Typography>
                    </Box>
                    <Slider
                      value={formData.focusPercentages[option.value]}
                      onChange={(e, newValue) => handleFocusPercentageChange(option.value, newValue)}
                      min={0}
                      max={100}
                      step={5}
                      sx={{
                        color: 'var(--color-primary)',
                        '& .MuiSlider-thumb': {
                          backgroundColor: 'var(--color-primary)',
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: 'var(--color-primary)',
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: 'var(--color-border-primary)',
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ 
                      color: 'var(--color-text-secondary)',
                      display: 'block',
                      mt: 0.5
                    }}>
                      {option.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            {/* Total Percentage Display */}
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: 'var(--color-background-primary)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-primary)'
            }}>
              <Typography variant="body2" sx={{ 
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)',
                textAlign: 'center'
              }}>
                Total: {Object.values(formData.focusPercentages).reduce((sum, val) => sum + val, 0)}%
                {Object.values(formData.focusPercentages).reduce((sum, val) => sum + val, 0) === 100 ? ' ✓' : ' (Must equal 100%)'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* AI Schedule Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: 'var(--color-background-secondary)' }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'var(--color-text-primary)'
            }}>
              <CalendarTodayOutlined />
              AI Schedule Configuration
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Session Duration (minutes)"
                  type="number"
                  value={formData.sessionDuration}
                  onChange={(e) => handleInputChange('sessionDuration', parseInt(e.target.value) || 90)}
                  variant="outlined"
                  inputProps={{ min: 30, max: 180, step: 15 }}
                  helperText="Typical: 75-105 minutes"
                />
              </Grid>
            </Grid>

            {/* Date Range Info */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'var(--color-background-primary)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-primary)',
              mb: 2
            }}>
              <Typography variant="body2" sx={{ 
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)',
                textAlign: 'center'
              }}>
                {(() => {
                  const { days, weeks } = calculateDateRangeInfo();
                  return `Selected period: ${days} days (${weeks} week${weeks !== 1 ? 's' : ''})`;
                })()}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: 'var(--color-background-primary)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-primary)'
            }}>
              <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                <strong>How it works:</strong> AI creates a periodized training plan with optimal session distribution. 
                Sessions are intelligently spaced to maximize learning while ensuring proper recovery periods.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Focus Principles */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: 'var(--color-background-secondary)' }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'var(--color-text-primary)'
            }}>
              <TrendingUpOutlined />
              Focus Principles (max 7)
            </Typography>
            <Typography variant="body2" sx={{ 
              mb: 3, 
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic'
            }}>
              Select specific principles to focus on during training. These will override the auto-selected principles based on your focus percentages.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {['attacking', 'defending', 'transition'].map(section => {
                const list = principlesData.principles_of_play[section] || [];
                return (
                  <Box key={section}>
                    <Typography variant="caption" sx={{ 
                      textTransform: 'uppercase', 
                      fontWeight: 600, 
                      letterSpacing: 0.5,
                      color: 'var(--color-text-primary)',
                      display: 'block',
                      mb: 1
                    }}>
                      {section}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {list.map(p => {
                        const active = selectedPrinciples.includes(p.name);
                        const isDisabled = !active && selectedPrinciples.length >= 7;
                        return (
                          <Chip
                            key={p.name}
                            label={p.name}
                            size="small"
                            color={active ? 'primary' : 'default'}
                            variant={active ? 'filled' : 'outlined'}
                            onClick={() => handlePrincipleToggle(p.name)}
                            disabled={isDisabled}
                            sx={{
                              '&:hover': {
                                backgroundColor: active ? 'var(--color-primary-hover)' : 'var(--color-background-primary)'
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
            
          </Paper>
        </Grid>

        {/* Generate Button */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
              <PlanSettingsForm 
                settings={planSettings}
                onSettingsChange={setPlanSettings}
                disabled={loading}
                showAsDialog={true}
              />
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={handleGenerate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowOutlined />}
              sx={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-white)',
                '&:hover': { backgroundColor: 'var(--color-primary-hover)' },
                px: 6,
                py: 2,
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                textTransform: 'none',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {loading ? 'AI is Creating Your Plan...' : 'Generate AI Training Plan'}
            </Button>
            <Typography variant="caption" sx={{ 
              display: 'block', 
              mt: 2, 
              color: 'var(--color-text-secondary)' 
            }}>
              AI will analyze fixtures and create a {formData.planDuration}-week training plan focused on your priorities
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default SmartCoachInputForm;
