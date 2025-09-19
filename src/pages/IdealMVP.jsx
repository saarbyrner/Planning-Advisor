import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import { 
  ArrowBackOutlined,
  PsychologyOutlined,
  SportsSoccerOutlined,
  TimelineOutlined,
  CheckCircleOutlined
} from '@mui/icons-material';
import SmartCoachInputForm from '../components/SmartCoachInputForm';
import { generateTeamPlan } from '../utils/generatePlan';
import { saveTeamPlan, getTeamFixtures } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const IdealMVP = ({ onBack }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [generationProgress, setGenerationProgress] = useState({
    phase: 'idle',
    message: '',
    progress: 0,
    details: []
  });

  // Simplified to single step since we redirect immediately after generation

  const handleGeneratePlan = async (data) => {
    setLoading(true);
    setFormData(data);
    
    // Initialize progress tracking
    setGenerationProgress({
      phase: 'initializing',
      message: 'Initializing AI periodization system...',
      progress: 0,
      details: []
    });
    
    try {
      // Calculate principle percentages based on priorities
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'calculating_priorities',
        message: 'Calculating training priorities and focus areas...',
        progress: 5,
        details: [...prev.details, 'Analyzing focus percentages']
      }));
      
      const principlePercentages = calculatePrinciplePercentages(data);
      
      // Load fixtures for the team
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'loading_fixtures',
        message: 'Loading team fixtures and match data...',
        progress: 10,
        details: [...prev.details, 'Loading fixtures for team 1']
      }));
      
      console.log('Loading fixtures for team 1...');
      const fixtures = await getTeamFixtures(1);
      console.log('Loaded fixtures:', fixtures);
      
      // Generate the high-level plan with AI-determined schedule
      const planOptions = {
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate,
        fixtures: fixtures, // Pass fixtures to AI
        objective: `Focus distribution: ${Object.entries(data.focusPercentages || {})
          .filter(([_, percentage]) => percentage > 0)
          .map(([principle, percentage]) => `${principle} (${percentage}%)`)
          .join(', ')}`,
        userSelectedPrinciples: Object.entries(data.focusPercentages || {})
          .filter(([_, percentage]) => percentage > 0)
          .map(([principle, _]) => principle),
        variability: 'medium', // Balanced variability for intelligent periodization
        generationMode: 'generative' // Use AI to generate intelligent, parameter-driven drills
      };

      console.log('Generating plan with options:', planOptions);

      // Start AI generation with progress tracking
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'ai_generation',
        message: 'AI is creating unique periodization structure...',
        progress: 20,
        details: [...prev.details, 'Starting AI periodization generation']
      }));

      const plan = await generateTeamPlan(1, planOptions); // Use teamId 1 as default - generates full plan with AI-created drills
      
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'ai_complete',
        message: 'AI periodization complete! Processing results...',
        progress: 80,
        details: [...prev.details, 'AI generation completed successfully']
      }));

      // Add our calculated percentages to the plan
      plan.principlePercentages = principlePercentages;
      plan.expectedImprovements = calculateExpectedImprovements(principlePercentages);
      plan.coachRequirements = data;

      // Remove intermediary step - redirect immediately
      
      // Calculate duration for plan name
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const weeks = Math.ceil(daysDiff / 7);
      
      // Get the primary focus area for naming
      const primaryFocus = Object.entries(data.focusPercentages || {})
        .filter(([_, percentage]) => percentage > 0)
        .sort(([_, a], [__, b]) => b - a)[0]?.[0] || 'training';
      
      // Save the plan and get the plan ID
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'saving',
        message: 'Saving your unique training plan...',
        progress: 90,
        details: [...prev.details, 'Saving plan to database']
      }));
      
      const savedPlan = await saveTeamPlan(1, plan, `${weeks}-week ${primaryFocus} focus plan`);
      
      console.log('Saved plan:', savedPlan); // Debug log
      console.log('Saved plan ID:', savedPlan?.id); // Debug log
      
      if (!savedPlan || !savedPlan.id) {
        console.error('No plan ID returned from saveTeamPlan');
        setSnackbar({ 
          open: true, 
          message: 'Plan saved but could not redirect. Please navigate manually.', 
          severity: 'warning' 
        });
        return;
      }
      
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'complete',
        message: 'Training plan generated successfully! Redirecting...',
        progress: 100,
        details: [...prev.details, 'Plan ready for viewing']
      }));
      
      setSnackbar({ 
        open: true, 
        message: 'Training plan generated successfully! Redirecting to plan view...', 
        severity: 'success' 
      });
      
      // Small delay to show completion
      setTimeout(() => {
        // Redirect to team planning page with the saved plan
        const redirectUrl = `/team-planning?planId=${savedPlan.id}`;
        console.log('Redirecting to:', redirectUrl); // Debug log
        
        try {
          navigate(redirectUrl);
          console.log('Navigate called successfully');
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback to window.location
          window.location.href = redirectUrl;
        }
      }, 1000);
    } catch (error) {
      console.error('Error generating plan:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to generate plan. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePrinciplePercentages = (data) => {
    // Use the focus percentages directly from the form data
    return data.focusPercentages || {};
  };

  const calculateExpectedImprovements = (percentages) => {
    // Mock expected improvements based on focus percentages
    const improvements = {};
    Object.entries(percentages).forEach(([principle, percentage]) => {
      // Base improvement of 10-20% scaled by focus percentage
      const baseImprovement = 10 + (percentage / 5);
      improvements[principle] = Math.round(baseImprovement);
    });
    return improvements;
  };




  // Removed unused functions: handleNext, handleBack, renderStepContent

  // Loading screen component
  const renderLoadingScreen = () => {
    const getPhaseIcon = (phase) => {
      switch (phase) {
        case 'initializing':
        case 'calculating_priorities':
        case 'loading_fixtures':
          return <PsychologyOutlined sx={{ fontSize: 40, color: 'var(--color-primary)' }} />;
        case 'ai_generation':
          return <SportsSoccerOutlined sx={{ fontSize: 40, color: 'var(--color-primary)' }} />;
        case 'ai_complete':
        case 'saving':
          return <TimelineOutlined sx={{ fontSize: 40, color: 'var(--color-primary)' }} />;
        case 'complete':
          return <CheckCircleOutlined sx={{ fontSize: 40, color: 'var(--color-success)' }} />;
        default:
          return <PsychologyOutlined sx={{ fontSize: 40, color: 'var(--color-primary)' }} />;
      }
    };

    const getPhaseColor = (phase) => {
      switch (phase) {
        case 'complete':
          return 'var(--color-success)';
        case 'ai_generation':
          return 'var(--color-primary)';
        default:
          return 'var(--color-primary)';
      }
    };

    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ 
          p: 4, 
          textAlign: 'center',
          backgroundColor: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <CardContent>
            <Box sx={{ mb: 4 }}>
              {getPhaseIcon(generationProgress.phase)}
            </Box>
            
            <Typography variant="h4" sx={{ 
              mb: 2,
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)'
            }}>
              AI Periodization in Progress
            </Typography>
            
            <Typography variant="h6" sx={{ 
              mb: 4,
              color: getPhaseColor(generationProgress.phase),
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {generationProgress.message}
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <LinearProgress 
                variant="determinate" 
                value={generationProgress.progress} 
                sx={{ 
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'var(--color-background-secondary)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getPhaseColor(generationProgress.phase),
                    borderRadius: 4
                  }
                }}
              />
              <Typography variant="body2" sx={{ 
                mt: 1,
                color: 'var(--color-text-secondary)'
              }}>
                {generationProgress.progress}% Complete
              </Typography>
            </Box>
            
            {generationProgress.details.length > 0 && (
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 2,
                  color: 'var(--color-text-primary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  Progress Details:
                </Typography>
                <Stack spacing={1}>
                  {generationProgress.details.map((detail, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutlined sx={{ 
                        fontSize: 16, 
                        color: 'var(--color-success)', 
                        mr: 1 
                      }} />
                      <Typography variant="body2" sx={{ 
                        color: 'var(--color-text-secondary)'
                      }}>
                        {detail}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
            
            {generationProgress.phase === 'ai_generation' && (
              <Box sx={{ mt: 4 }}>
                <Chip 
                  label="AI is creating unique periodization based on your parameters"
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-primary)'
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        {onBack && (
          <Tooltip title="Back to plans">
            <IconButton 
              onClick={onBack}
              sx={{ 
                mr: 2,
                color: 'var(--color-text-primary)',
                '&:hover': { backgroundColor: 'var(--color-background-secondary)' }
              }}
            >
              <ArrowBackOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Typography variant="h4" sx={{ 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)'
        }}>
          Create New Training Plan
        </Typography>
      </Box>

      {/* Main Content */}
      {loading ? (
        renderLoadingScreen()
      ) : (
        <Box sx={{ mb: 4 }}>
          <SmartCoachInputForm 
            onGeneratePlan={handleGeneratePlan}
            loading={loading}
          />
        </Box>
      )}

      {/* Navigation removed - redirecting immediately after generation */}

      {/* Success Message removed - redirecting immediately after generation */}

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default IdealMVP;
