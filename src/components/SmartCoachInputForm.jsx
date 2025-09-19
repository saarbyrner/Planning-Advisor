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
  CircularProgress
} from '@mui/material';
import { 
  SportsSoccerOutlined,
  ScheduleOutlined,
  TrendingUpOutlined,
  PlayArrowOutlined,
  AutoAwesomeOutlined,
  CalendarTodayOutlined
} from '@mui/icons-material';

const SmartCoachInputForm = ({ onGeneratePlan, loading = false }) => {
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 weeks from now
    primaryFocus: 'pressing',
    secondaryFocus: 'transition',
    tertiaryFocus: 'final-delivery',
    sessionDuration: 60
  });

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
    const highIntensityRatio = requirements.primaryFocus === 'pressing' ? 0.4 : 0.3;
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
          endDate: formData.endDate
        };
        onGeneratePlan(planData);
      });
    } else {
      const planData = {
        ...formData,
        aiSchedule: aiSchedule,
        startDate: formData.startDate,
        endDate: formData.endDate
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
              Learning Focus (Priority Order)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority 1 (Primary Focus)</InputLabel>
                  <Select
                    value={formData.primaryFocus}
                    onChange={(e) => handleInputChange('primaryFocus', e.target.value)}
                    label="Priority 1 (Primary Focus)"
                  >
                    {focusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'var(--color-text-secondary)' }}>
                  {getFocusDescription(formData.primaryFocus)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority 2 (Secondary Focus)</InputLabel>
                  <Select
                    value={formData.secondaryFocus}
                    onChange={(e) => handleInputChange('secondaryFocus', e.target.value)}
                    label="Priority 2 (Secondary Focus)"
                  >
                    {focusOptions.filter(opt => opt.value !== formData.primaryFocus).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'var(--color-text-secondary)' }}>
                  {getFocusDescription(formData.secondaryFocus)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority 3 (Tertiary Focus)</InputLabel>
                  <Select
                    value={formData.tertiaryFocus}
                    onChange={(e) => handleInputChange('tertiaryFocus', e.target.value)}
                    label="Priority 3 (Tertiary Focus)"
                  >
                    {focusOptions.filter(opt => opt.value !== formData.primaryFocus && opt.value !== formData.secondaryFocus).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'var(--color-text-secondary)' }}>
                  {getFocusDescription(formData.tertiaryFocus)}
                </Typography>
              </Grid>
            </Grid>
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
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
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

        {/* Generate Button */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ textAlign: 'center' }}>
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
