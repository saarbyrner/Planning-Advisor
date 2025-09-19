import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Alert,
  Snackbar
} from '@mui/material';
import SmartCoachInputForm from '../components/SmartCoachInputForm';
import { generateHighLevelTeamPlan } from '../utils/generatePlan';
import { saveTeamPlan, getTeamFixtures } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const IdealMVP = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Simplified to single step since we redirect immediately after generation

  const handleGeneratePlan = async (data) => {
    setLoading(true);
    setFormData(data);
    
    try {
      // Calculate principle percentages based on priorities
      const principlePercentages = calculatePrinciplePercentages(data);
      
      // Load fixtures for the team
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
        variability: 'medium',
        generationMode: 'curated'
      };

      console.log('Generating plan with options:', planOptions);

      const plan = await generateHighLevelTeamPlan(1, planOptions); // Use teamId 1 as default

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
      
      setSnackbar({ 
        open: true, 
        message: 'Training plan generated successfully! Redirecting to plan view...', 
        severity: 'success' 
      });
      
      // Redirect immediately to team planning page with the saved plan
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* Progress Stepper */}
      <Box sx={{ mb: 4 }}>
        {/* Stepper removed - redirecting immediately after generation */}
      </Box>

      {/* Main Content */}
      <Box sx={{ mb: 4 }}>
        <SmartCoachInputForm 
          onGeneratePlan={handleGeneratePlan}
          loading={loading}
        />
      </Box>

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
