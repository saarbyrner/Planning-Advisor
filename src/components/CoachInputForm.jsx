import { useState } from 'react';
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
  Divider
} from '@mui/material';
import { 
  SportsSoccerOutlined,
  ScheduleOutlined,
  TrendingUpOutlined,
  PlayArrowOutlined
} from '@mui/icons-material';

const CoachInputForm = ({ onGeneratePlan, loading = false }) => {
  const [formData, setFormData] = useState({
    sessionsPerWeek: 4,
    sessionDuration: 60,
    planDuration: 5,
    primaryFocus: 'pressing',
    secondaryFocus: 'transition',
    tertiaryFocus: 'final-delivery',
    highIntensitySessions: 2,
    mediumIntensitySessions: 2,
    teamId: 1
  });

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
  };

  const handleGenerate = () => {
    onGeneratePlan(formData);
  };

  const getFocusDescription = (focusValue) => {
    return focusOptions.find(opt => opt.value === focusValue)?.description || '';
  };

  return (
    <Card sx={{ 
      p: 4, 
      maxWidth: 800, 
      mx: 'auto',
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <SportsSoccerOutlined sx={{ fontSize: 48, color: 'var(--color-primary)', mb: 2 }} />
        <Typography variant="h4" sx={{ 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          mb: 1
        }}>
          Create Your Training Plan
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'var(--color-text-secondary)',
          maxWidth: 600,
          mx: 'auto'
        }}>
          Tell us your requirements and we'll generate a personalized training plan with clear focus areas and expected outcomes.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Requirements */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: 'var(--color-background-secondary)' }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'var(--color-text-primary)'
            }}>
              <ScheduleOutlined />
              Training Schedule
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Sessions per week"
                  type="number"
                  value={formData.sessionsPerWeek}
                  onChange={(e) => handleInputChange('sessionsPerWeek', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 1, max: 7 }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Session duration (minutes)"
                  type="number"
                  value={formData.sessionDuration}
                  onChange={(e) => handleInputChange('sessionDuration', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 30, max: 120 }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
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

        {/* Intensity Requirements */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: 'var(--color-background-secondary)' }}>
            <Typography variant="h6" sx={{ 
              mb: 2,
              color: 'var(--color-text-primary)'
            }}>
              Intensity Distribution
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'var(--color-text-secondary)' }}>
              How many sessions should be high intensity vs medium intensity per week?
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="High intensity sessions per week"
                  type="number"
                  value={formData.highIntensitySessions}
                  onChange={(e) => handleInputChange('highIntensitySessions', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: formData.sessionsPerWeek }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Medium intensity sessions per week"
                  type="number"
                  value={formData.mediumIntensitySessions}
                  onChange={(e) => handleInputChange('mediumIntensitySessions', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: formData.sessionsPerWeek }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`High: ${formData.highIntensitySessions} sessions`} 
                color="error" 
                size="small" 
              />
              <Chip 
                label={`Medium: ${formData.mediumIntensitySessions} sessions`} 
                color="warning" 
                size="small" 
              />
              <Chip 
                label={`Low/Recovery: ${Math.max(0, formData.sessionsPerWeek - formData.highIntensitySessions - formData.mediumIntensitySessions)} sessions`} 
                color="success" 
                size="small" 
              />
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
              This will create a {formData.planDuration}-week plan with {formData.sessionsPerWeek} sessions per week
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default CoachInputForm;
