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
import PrincipleBreakdown from '../components/PrincipleBreakdown';
import SimplifiedSessionDisplay from '../components/SimplifiedSessionDisplay';
import { generateHighLevelTeamPlan, generateSessionDrills } from '../utils/generatePlan';
import { saveTeamPlan } from '../utils/supabase';

const IdealMVP = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const steps = [
    { label: 'Set Requirements', icon: <SportsSoccerOutlined /> },
    { label: 'Review Focus', icon: <TrendingUpOutlined /> },
    { label: 'View Sessions', icon: <ScheduleOutlined /> }
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
        objective: `Focus on ${data.primaryFocus} (primary), ${data.secondaryFocus} (secondary), ${data.tertiaryFocus} (tertiary)`,
        userSelectedPrinciples: [data.primaryFocus, data.secondaryFocus, data.tertiaryFocus],
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
      
      // Save the plan
      await saveTeamPlan(1, plan, `${weeks}-week ${data.primaryFocus} focus plan`);
      
      setSnackbar({ 
        open: true, 
        message: 'Training plan generated successfully!', 
        severity: 'success' 
      });
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
    // Simple percentage calculation based on priorities
    const percentages = {
      [data.primaryFocus]: 50,
      [data.secondaryFocus]: 30,
      [data.tertiaryFocus]: 20
    };
    return percentages;
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

  const handleAdjustPercentages = (newPercentages) => {
    if (generatedPlan) {
      const updatedPlan = {
        ...generatedPlan,
        principlePercentages: newPercentages,
        expectedImprovements: calculateExpectedImprovements(newPercentages)
      };
      setGeneratedPlan(updatedPlan);
      setSnackbar({ 
        open: true, 
        message: 'Plan focus updated!', 
        severity: 'success' 
      });
    }
  };

  const handleRegenerateSession = async (sessionIndex) => {
    if (!generatedPlan) return;
    
    setRegenerating(true);
    try {
      await generateSessionDrills(generatedPlan, sessionIndex, { variability: 'medium' });
      setGeneratedPlan({ ...generatedPlan });
      setSnackbar({ 
        open: true, 
        message: `Session ${sessionIndex + 1} regenerated!`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error regenerating session:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to regenerate session.', 
        severity: 'error' 
      });
    } finally {
      setRegenerating(false);
    }
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
          <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
            <PrincipleBreakdown 
              principles={generatedPlan?.principlePercentages || {}}
              onAdjustPercentages={handleAdjustPercentages}
              expectedImprovements={generatedPlan?.expectedImprovements || {}}
            />
            {generatedPlan && (
              <Card sx={{ mt: 3, p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Plan Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'var(--color-primary)' }}>
                        {generatedPlan.total_days}
                      </Typography>
                      <Typography variant="body2">Total Days</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'var(--color-primary)' }}>
                        {generatedPlan.sessions?.length || 0}
                      </Typography>
                      <Typography variant="body2">Training Sessions</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'var(--color-primary)' }}>
                        {generatedPlan.matches?.length || 0}
                      </Typography>
                      <Typography variant="body2">Matches</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'var(--color-primary)' }}>
                        {(() => {
                          if (formData?.startDate && formData?.endDate) {
                            const startDate = new Date(formData.startDate);
                            const endDate = new Date(formData.endDate);
                            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                            return Math.ceil(daysDiff / 7);
                          }
                          return 0;
                        })()}
                      </Typography>
                      <Typography variant="body2">Weeks</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Card>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {generatedPlan?.sessions && (
              <SimplifiedSessionDisplay 
                sessions={generatedPlan.sessions}
                selectedSession={selectedSession}
                onSessionSelect={setSelectedSession}
                onRegenerateSession={handleRegenerateSession}
                regenerating={regenerating}
              />
            )}
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
