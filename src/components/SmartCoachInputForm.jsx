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
import { getTeamFixtures } from '../utils/supabase';

const SmartCoachInputForm = ({ onGeneratePlan, loading = false }) => {
  const [formData, setFormData] = useState({
    teamId: 1,
    planDuration: 5,
    primaryFocus: 'pressing',
    secondaryFocus: 'transition',
    tertiaryFocus: 'final-delivery',
    sessionDuration: 60,
    startDate: new Date().toISOString().split('T')[0]
  });

  const [fixtures, setFixtures] = useState([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [aiSchedule, setAiSchedule] = useState(null);
  const [showAiSchedule, setShowAiSchedule] = useState(false);

  const focusOptions = [
    { value: 'pressing', label: 'Pressing', description: 'High-intensity defensive pressure' },
    { value: 'transition', label: 'Transition', description: 'Quick switches between attack and defense' },
    { value: 'final-delivery', label: 'Final Delivery', description: 'Crossing, finishing, and final third play' },
    { value: 'possession', label: 'Possession', description: 'Ball retention and circulation' },
    { value: 'defensive-shape', label: 'Defensive Shape', description: 'Organized defensive structure' },
    { value: 'attacking-patterns', label: 'Attacking Patterns', description: 'Build-up play and goal creation' }
  ];

  // Load fixtures when team changes
  useEffect(() => {
    loadFixtures();
  }, [formData.teamId]);

  const loadFixtures = async () => {
    setLoadingFixtures(true);
    try {
      const teamFixtures = await getTeamFixtures(formData.teamId);
      setFixtures(teamFixtures);
    } catch (error) {
      console.error('Error loading fixtures:', error);
      setFixtures([]);
    } finally {
      setLoadingFixtures(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset AI schedule when inputs change
    setAiSchedule(null);
    setShowAiSchedule(false);
  };

  const generateAiSchedule = async () => {
    if (!fixtures.length) {
      alert('No fixtures found for this team. Please check the team selection.');
      return;
    }

    setLoadingFixtures(true);
    try {
      // Calculate end date
      const endDate = new Date(formData.startDate);
      endDate.setDate(endDate.getDate() + (formData.planDuration * 7));
      
      // Filter fixtures in range
      const fixturesInRange = fixtures.filter(f => {
        const fixtureDate = new Date(f.date);
        return fixtureDate >= new Date(formData.startDate) && fixtureDate <= endDate;
      });

      // AI determines optimal schedule based on fixtures
      const schedule = await determineOptimalSchedule(fixturesInRange, formData);
      setAiSchedule(schedule);
      setShowAiSchedule(true);
    } catch (error) {
      console.error('Error generating AI schedule:', error);
    } finally {
      setLoadingFixtures(false);
    }
  };

  const determineOptimalSchedule = async (fixturesInRange, requirements) => {
    // This would ideally call an AI service, but for now we'll use intelligent heuristics
    const schedule = {
      totalSessions: 0,
      sessionsPerWeek: [],
      intensityDistribution: { high: 0, medium: 0, low: 0 },
      weeklyBreakdown: [],
      rationale: ''
    };

    // Calculate sessions based on fixture density
    const weeks = requirements.planDuration;
    const totalFixtures = fixturesInRange.length;
    
    // AI logic: More fixtures = fewer training sessions per week
    let baseSessionsPerWeek;
    if (totalFixtures >= weeks * 2) {
      // Heavy fixture load (2+ matches per week average)
      baseSessionsPerWeek = 2;
      schedule.rationale = "Heavy fixture schedule detected. Reduced training sessions to prevent overtraining and focus on recovery.";
    } else if (totalFixtures >= weeks) {
      // Normal fixture load (1 match per week average)
      baseSessionsPerWeek = 3;
      schedule.rationale = "Normal fixture schedule. Balanced training sessions with proper recovery periods.";
    } else {
      // Light fixture load
      baseSessionsPerWeek = 4;
      schedule.rationale = "Light fixture schedule. Increased training sessions to maximize development opportunities.";
    }

    // Generate weekly breakdown
    for (let week = 0; week < weeks; week++) {
      const weekStart = new Date(requirements.startDate);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekFixtures = fixturesInRange.filter(f => {
        const fixtureDate = new Date(f.date);
        return fixtureDate >= weekStart && fixtureDate <= weekEnd;
      });

      let weekSessions = baseSessionsPerWeek;
      
      // Adjust based on week's fixtures
      if (weekFixtures.length >= 2) {
        weekSessions = Math.max(1, weekSessions - 1); // Reduce sessions for heavy fixture weeks
      } else if (weekFixtures.length === 0) {
        weekSessions = Math.min(5, weekSessions + 1); // Add sessions for free weeks
      }

      const weekBreakdown = {
        week: week + 1,
        sessions: weekSessions,
        fixtures: weekFixtures.length,
        intensity: weekFixtures.length >= 2 ? 'recovery-focused' : 
                  weekFixtures.length === 1 ? 'balanced' : 'development-focused'
      };

      schedule.weeklyBreakdown.push(weekBreakdown);
      schedule.totalSessions += weekSessions;
    }

    // Calculate intensity distribution based on focus areas
    const totalSessions = schedule.totalSessions;
    const highIntensityRatio = requirements.primaryFocus === 'pressing' ? 0.4 : 0.3;
    const mediumIntensityRatio = 0.4;
    const lowIntensityRatio = 1 - highIntensityRatio - mediumIntensityRatio;

    schedule.intensityDistribution = {
      high: Math.round(totalSessions * highIntensityRatio),
      medium: Math.round(totalSessions * mediumIntensityRatio),
      low: Math.round(totalSessions * lowIntensityRatio)
    };

    schedule.rationale += ` Generated ${schedule.totalSessions} total sessions with ${schedule.intensityDistribution.high} high-intensity, ${schedule.intensityDistribution.medium} medium-intensity, and ${schedule.intensityDistribution.low} low-intensity sessions.`;

    return schedule;
  };

  const handleGenerate = () => {
    if (!aiSchedule) {
      alert('Please generate the AI schedule first by clicking "Generate AI Schedule"');
      return;
    }
    
    const planData = {
      ...formData,
      aiSchedule: aiSchedule,
      fixtures: fixtures
    };
    
    onGeneratePlan(planData);
  };

  const getFocusDescription = (focusValue) => {
    return focusOptions.find(opt => opt.value === focusValue)?.description || '';
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
        <Typography variant="h4" sx={{ 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          mb: 1
        }}>
          AI-Powered Training Plan
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'var(--color-text-secondary)',
          maxWidth: 600,
          mx: 'auto'
        }}>
          Tell us your focus areas and let AI determine the optimal training schedule based on your fixtures.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Team and Duration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: 'var(--color-background-secondary)' }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'var(--color-text-primary)'
            }}>
              <SportsSoccerOutlined />
              Team & Plan Duration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Team</InputLabel>
                  <Select
                    value={formData.teamId}
                    onChange={(e) => handleInputChange('teamId', e.target.value)}
                    label="Team"
                  >
                    <MenuItem value={1}>Arsenal</MenuItem>
                    <MenuItem value={2}>Chelsea</MenuItem>
                    <MenuItem value={3}>Liverpool</MenuItem>
                    <MenuItem value={4}>Manchester United</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plan duration (weeks)"
                  type="number"
                  value={formData.planDuration}
                  onChange={(e) => handleInputChange('planDuration', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 1, max: 12 }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

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

        {/* AI Schedule Generation */}
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
              AI-Generated Training Schedule
            </Typography>
            
            {fixtures.length > 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Found {fixtures.length} fixtures for this team. AI will determine optimal training schedule.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No fixtures found for this team. AI will use default schedule.
              </Alert>
            )}

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Button
                variant="contained"
                onClick={generateAiSchedule}
                disabled={loadingFixtures}
                startIcon={loadingFixtures ? <CircularProgress size={20} /> : <AutoAwesomeOutlined />}
                sx={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-white)',
                  '&:hover': { backgroundColor: 'var(--color-primary-hover)' },
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                {loadingFixtures ? 'Analyzing Fixtures...' : 'Generate AI Schedule'}
              </Button>
            </Box>

            {showAiSchedule && aiSchedule && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'var(--font-weight-medium)' }}>
                  AI-Determined Schedule:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'var(--color-primary)' }}>
                        {aiSchedule.totalSessions}
                      </Typography>
                      <Typography variant="body2">Total Sessions</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'var(--color-primary)' }}>
                        {aiSchedule.intensityDistribution.high}
                      </Typography>
                      <Typography variant="body2">High Intensity</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'var(--color-primary)' }}>
                        {aiSchedule.intensityDistribution.medium}
                      </Typography>
                      <Typography variant="body2">Medium Intensity</Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                  {aiSchedule.rationale}
                </Typography>
              </Box>
            )}
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
              disabled={loading || !aiSchedule}
              startIcon={<PlayArrowOutlined />}
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
              {loading ? 'Generating Your Plan...' : 'Generate Training Plan'}
            </Button>
            <Typography variant="caption" sx={{ 
              display: 'block', 
              mt: 2, 
              color: 'var(--color-text-secondary)' 
            }}>
              {aiSchedule ? `AI will create a ${formData.planDuration}-week plan with ${aiSchedule.totalSessions} sessions` : 'Generate AI schedule first'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default SmartCoachInputForm;
