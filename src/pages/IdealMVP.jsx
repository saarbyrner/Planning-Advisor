import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel,
  Button,
  Alert,
  Snackbar,
  Paper,
  Grid,
  Card,
  Chip
} from '@mui/material';
import { 
  CheckCircleOutlined,
  SportsSoccerOutlined,
  TrendingUpOutlined,
  ScheduleOutlined
} from '@mui/icons-material';
import SmartCoachInputForm from '../components/SmartCoachInputForm';
import { generateHighLevelTeamPlan } from '../utils/generatePlan';
import { saveTeamPlan } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const IdealMVP = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const steps = [
    { label: 'Set Requirements', icon: <SportsSoccerOutlined /> },
    { label: 'Generated Plan', icon: <CheckCircleOutlined /> }
  ];

  const handleGeneratePlan = async (data) => {
    setLoading(true);
    setFormData(data);
    
    try {
      // Calculate principle percentages based on priorities
      const principlePercentages = calculatePrinciplePercentages(data);
      
      // Generate the high-level plan with AI-determined schedule
      const planOptions = {
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate,
        objective: `Focus distribution: ${Object.entries(data.focusPercentages || {})
          .filter(([_, percentage]) => percentage > 0)
          .map(([principle, percentage]) => `${principle} (${percentage}%)`)
          .join(', ')}`,
        userSelectedPrinciples: Object.entries(data.focusPercentages || {})
          .filter(([_, percentage]) => percentage > 0)
          .map(([principle, _]) => principle),
        variability: 'medium',
        generationMode: 'curated'
      };

      // If AI schedule is provided, pass fixtures to the AI
      if (data.aiSchedule && data.fixtures) {
        planOptions.fixtures = data.fixtures;
        planOptions.aiSchedule = data.aiSchedule;
      }

      const plan = await generateHighLevelTeamPlan(1, planOptions); // Use teamId 1 as default

      // Add our calculated percentages to the plan
      plan.principlePercentages = principlePercentages;
      plan.expectedImprovements = calculateExpectedImprovements(principlePercentages);
      plan.coachRequirements = data;

      setGeneratedPlan(plan);
      setCurrentStep(1);
      
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
      const savedPlan = await saveTeamPlan(1, plan, `${weeks}-week ${primaryFocus} focus plan`);
      
      console.log('Saved plan:', savedPlan); // Debug log
      
      setSnackbar({ 
        open: true, 
        message: 'Training plan generated successfully! Redirecting to plan view...', 
        severity: 'success' 
      });
      
      // Redirect to team planning page with the saved plan
      setTimeout(() => {
        console.log('Redirecting to:', `/team-periodization?planId=${savedPlan.id}`); // Debug log
        navigate(`/team-periodization?planId=${savedPlan.id}`);
      }, 1500);
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




  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SmartCoachInputForm 
            onGeneratePlan={handleGeneratePlan}
            loading={loading}
          />
        );
      case 1:
        return (
          <Box sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ mb: 2, color: 'var(--color-text-primary)' }}>
              Plan Generated Successfully!
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)' }}>
              Redirecting you to the full team planning interface...
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* Progress Stepper */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel 
                icon={step.icon}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: 'var(--font-weight-medium)'
                  }
                }}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>
        {renderStepContent()}
      </Box>

      {/* Navigation */}
      {currentStep > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', maxWidth: 1000, mx: 'auto' }}>
          <Button 
            onClick={handleBack}
            variant="outlined"
            disabled={currentStep === 0}
          >
            Back
          </Button>
          {currentStep < steps.length - 1 && (
            <Button 
              onClick={handleNext}
              variant="contained"
              disabled={!generatedPlan}
              sx={{
                backgroundColor: 'var(--color-primary)',
                '&:hover': { backgroundColor: 'var(--color-primary-hover)' }
              }}
            >
              Next
            </Button>
          )}
        </Box>
      )}

      {/* Success Message */}
      {currentStep === steps.length - 1 && generatedPlan && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <CheckCircleOutlined sx={{ fontSize: 64, color: 'var(--color-success)', mb: 2 }} />
          <Typography variant="h5" sx={{ 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            mb: 1
          }}>
            Your training plan is ready!
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)' }}>
            You can now view and customize your sessions, or generate a new plan with different requirements.
          </Typography>
        </Box>
      )}

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
