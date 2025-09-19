import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import { 
  VisibilityOutlined,
  CalendarTodayOutlined,
  GroupOutlined,
  TimelineOutlined,
  RefreshOutlined,
  DeleteOutlined,
  AddOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SettingsOutlined,
  KeyOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAllTeamPlans, deleteTeamPlan, updateTeamPlanTitle } from '../utils/supabase';
import squads from '../data/squads_teams.json';
import IdealMVP from './IdealMVP';

function PlanManagement() {
  // Component state initialization
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [updatingTitle, setUpdatingTitle] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [showIdealMVP, setShowIdealMVP] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAllPlans() {
      try {
        setLoading(true);
        const allPlans = await getAllTeamPlans();
        setPlans(allPlans);
        setError(null);
      } catch (err) {
        console.error('Error loading plans:', err);
        setError('Failed to load plans. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadAllPlans();
    
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('ai-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const getTeamName = (teamId) => {
    const team = squads.find(s => s.id === teamId);
    return team ? team.name : `Team ${teamId}`;
  };

  const getPlanTitle = (plan) => {
    // Use direct database field if available, otherwise fallback to parsing
    if (plan.title && plan.title.trim()) {
      return plan.title;
    }
    if (plan.plan && plan.plan.summary) {
      const firstSentence = plan.plan.summary.split('.')[0];
      return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
    }
    return 'Training Plan';
  };

  const getPlanDuration = (plan) => {
    // Use direct database field if available, otherwise fallback to parsing
    if (plan.duration_days) {
      return `${plan.duration_days} days`;
    }
    if (plan.plan) {
      if (plan.plan.timeline && Array.isArray(plan.plan.timeline)) {
        return `${plan.plan.timeline.length} days`;
      }
      if (plan.plan.sessions && Array.isArray(plan.plan.sessions)) {
        return `${plan.plan.sessions.length} sessions`;
      }
    }
    return 'Unknown';
  };


  const getPlanDates = (plan) => {
    let start = 'Unknown';
    let end = 'Unknown';
    if (plan.start_date) {
      start = new Date(plan.start_date).toLocaleDateString();
    } else if (plan.plan && plan.plan.sessions && plan.plan.sessions.length > 0) {
      const dates = plan.plan.sessions
        .map(session => session.date)
        .filter(date => date)
        .sort();
      if (dates.length > 0) {
        start = new Date(dates[0]).toLocaleDateString();
      }
    }
    if (plan.end_date) {
      end = new Date(plan.end_date).toLocaleDateString();
    } else if (plan.plan && plan.plan.sessions && plan.plan.sessions.length > 0) {
      const dates = plan.plan.sessions
        .map(session => session.date)
        .filter(date => date)
        .sort();
      if (dates.length > 0) {
        end = new Date(dates[dates.length - 1]).toLocaleDateString();
      }
    }
    return `${start} - ${end}`;
  };

  const getIntensityDistribution = (plan) => {
    if (!plan.timeline || !Array.isArray(plan.timeline)) {
      return { high: 0, medium: 0, low: 0 };
    }
    
    const distribution = { high: 0, medium: 0, low: 0 };
    plan.timeline.forEach(day => {
      if (day.color === 'red') distribution.high++;
      else if (day.color === 'yellow') distribution.medium++;
      else if (day.color === 'green') distribution.low++;
    });
    
    return distribution;
  };

  const handleViewPlan = (plan) => {
    // Navigate to the team planning page with the plan loaded
    navigate(`/team-planning?planId=${plan.id}`);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const allPlans = await getAllTeamPlans();
      setPlans(allPlans);
      setError(null);
    } catch (err) {
      console.error('Error refreshing plans:', err);
      setError('Failed to refresh plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;
    
    try {
      setDeleting(true);
      await deleteTeamPlan(planToDelete.id);
      
      // Remove the deleted plan from the local state
      setPlans(prevPlans => prevPlans.filter(plan => plan.id !== planToDelete.id));
      
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      setError(null);
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete plan. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const handleCreateNewPlan = () => {
    // Show the Ideal MVP form to create a new plan
    setShowIdealMVP(true);
  };

  const handleBackToPlans = () => {
    // Return to the plans list and refresh
    setShowIdealMVP(false);
    handleRefresh();
  };

  const handleEditTitle = (plan) => {
    setEditingTitle(plan.id);
    setEditingTitleValue(plan.title || getPlanTitle(plan));
  };

  const handleSaveTitle = async (planId) => {
    if (!editingTitleValue.trim()) {
      setEditingTitle(null);
      setEditingTitleValue('');
      return;
    }

    try {
      setUpdatingTitle(true);
      await updateTeamPlanTitle(planId, editingTitleValue.trim());
      
      // Update the local state
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === planId 
            ? { ...plan, title: editingTitleValue.trim() }
            : plan
        )
      );
      
      setEditingTitle(null);
      setEditingTitleValue('');
      setError(null);
    } catch (err) {
      console.error('Error updating title:', err);
      setError('Failed to update title. Please try again.');
    } finally {
      setUpdatingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTitle(null);
    setEditingTitleValue('');
  };

  const handleApiKeyClick = () => {
    setApiKeyDialogOpen(true);
  };

  const handleApiKeySave = async () => {
    try {
      setSavingApiKey(true);
      // Save API key to localStorage
      localStorage.setItem('ai-api-key', apiKey.trim());
      setApiKeyDialogOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Failed to save API key. Please try again.');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleApiKeyCancel = () => {
    // Reset to saved value if user cancels
    const savedApiKey = localStorage.getItem('ai-api-key') || '';
    setApiKey(savedApiKey);
    setApiKeyDialogOpen(false);
  };

  const handleApiKeyClear = () => {
    localStorage.removeItem('ai-api-key');
    setApiKey('');
    setApiKeyDialogOpen(false);
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // If showing Ideal MVP, render it instead of the plans list
  if (showIdealMVP) {
    return <IdealMVP onBack={handleBackToPlans} />;
  }

  return (
    <Box sx={{ py: 'var(--spacing-lg)', px: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 'var(--spacing-lg)', px: 'var(--spacing-lg)' }}>
        <Typography variant="h5">
          Planning advisor
        </Typography>
        <Box sx={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Tooltip title="AI model settings">
            <IconButton onClick={handleApiKeyClick} color="primary">
              <KeyOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Create new plan">
            <IconButton onClick={handleCreateNewPlan} color="primary" sx={{ bgcolor: 'var(--color-primary)', color: 'var(--color-white)', '&:hover': { bgcolor: 'var(--color-primary-hover)' } }}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh plans">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {plans.length === 0 ? (
        <Alert severity="info" sx={{ mb: 'var(--spacing-md)', mx: 'var(--spacing-lg)' }}>
          No plans found. Click the + button above to create your first plan.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ width: '100%' }}>
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Intensity Distribution</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan, index) => {
                const intensity = getIntensityDistribution(plan.plan);
                return (
                  <TableRow key={plan.id || index} hover>
                    <TableCell>
                      {editingTitle === plan.id ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                          <TextField
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            size="small"
                            variant="outlined"
                            fullWidth
                            disabled={updatingTitle}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveTitle(plan.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                          />
                          <IconButton
                            onClick={() => handleSaveTitle(plan.id)}
                            disabled={updatingTitle}
                            size="small"
                            color="primary"
                          >
                            {updatingTitle ? <CircularProgress size={16} /> : <CheckOutlined />}
                          </IconButton>
                          <IconButton
                            onClick={handleCancelEdit}
                            disabled={updatingTitle}
                            size="small"
                            color="error"
                          >
                            <CloseOutlined />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {getPlanTitle(plan).toLowerCase()}
                          </Typography>
                          <IconButton
                            onClick={() => handleEditTitle(plan)}
                            size="small"
                            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <GroupOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {getTeamName(plan.team_id)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <TimelineOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {getPlanDuration(plan)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <CalendarTodayOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {getPlanDates(plan)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                        {intensity.high > 0 && (
                          <Chip 
                            label={`${intensity.high} high`} 
                            size="small" 
                            sx={{ backgroundColor: 'var(--color-error)', color: 'var(--color-white)' }}
                            variant="outlined"
                          />
                        )}
                        {intensity.medium > 0 && (
                          <Chip 
                            label={`${intensity.medium} med`} 
                            size="small" 
                            sx={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-white)' }}
                            variant="outlined"
                          />
                        )}
                        {intensity.low > 0 && (
                          <Chip 
                            label={`${intensity.low} low`} 
                            size="small" 
                            sx={{ backgroundColor: 'var(--color-success)', color: 'var(--color-white)' }}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Tooltip title="View plan">
                          <IconButton 
                            onClick={() => handleViewPlan(plan)}
                            color="primary"
                            size="small"
                          >
                            <VisibilityOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete plan">
                          <IconButton 
                            onClick={() => handleDeleteClick(plan)}
                            color="error"
                            size="small"
                          >
                            <DeleteOutlined />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-primary)'
          }
        }}
      >
        <DialogTitle 
          id="delete-dialog-title"
          sx={{
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            pb: 'var(--spacing-sm)'
          }}
        >
          Delete plan
        </DialogTitle>
        <DialogContent sx={{ px: 'var(--spacing-lg)', py: 'var(--spacing-md)' }}>
          <DialogContentText 
            id="delete-dialog-description"
            sx={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              lineHeight: 'var(--line-height-relaxed)',
              mb: 0
            }}
          >
            Are you sure you want to delete this plan for {planToDelete ? getTeamName(planToDelete.team_id) : ''}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 'var(--spacing-lg)', pb: 'var(--spacing-lg)', gap: 'var(--spacing-sm)' }}>
          <Button 
            variant="contained" 
            onClick={handleDeleteCancel} 
            disabled={deleting}
            sx={{
              backgroundColor: 'var(--button-secondary-bg)',
              color: 'var(--button-secondary-color)',
              '&:hover': { backgroundColor: 'var(--button-secondary-hover-bg)' },
              textTransform: 'var(--button-text-transform)',
              fontSize: 'var(--button-font-size)',
              fontWeight: 'var(--button-font-weight)',
              borderRadius: 'var(--button-border-radius)',
              px: 'var(--spacing-md)',
              py: 'var(--spacing-sm)'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteOutlined />}
            sx={{
              backgroundColor: 'var(--color-error)',
              color: 'var(--color-white)',
              '&:hover': { backgroundColor: 'var(--color-error-dark)' },
              '&:disabled': { 
                backgroundColor: 'var(--color-text-disabled)',
                color: 'var(--color-text-muted)'
              },
              textTransform: 'var(--button-text-transform)',
              fontSize: 'var(--button-font-size)',
              fontWeight: 'var(--button-font-weight)',
              borderRadius: 'var(--button-border-radius)',
              px: 'var(--spacing-md)',
              py: 'var(--spacing-sm)'
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Management Dialog */}
      <Dialog
        open={apiKeyDialogOpen}
        onClose={handleApiKeyCancel}
        aria-labelledby="api-key-dialog-title"
        aria-describedby="api-key-dialog-description"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-primary)'
          }
        }}
      >
        <DialogTitle 
          id="api-key-dialog-title"
          sx={{
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            pb: 'var(--spacing-sm)'
          }}
        >
          AI model API key
        </DialogTitle>
        <DialogContent sx={{ px: 'var(--spacing-lg)', py: 'var(--spacing-md)' }}>
          <DialogContentText 
            id="api-key-dialog-description"
            sx={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              lineHeight: 'var(--line-height-relaxed)',
              mb: 'var(--spacing-md)'
            }}
          >
            Enter your AI model API key to use custom models for plan generation. This will override the default model.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="API key"
            type="password"
            fullWidth
            variant="outlined"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            disabled={savingApiKey}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--radius-sm)',
                '& fieldset': {
                  borderColor: 'var(--color-border-primary)'
                },
                '&:hover fieldset': {
                  borderColor: 'var(--color-border-focus)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--color-primary)'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'var(--color-text-secondary)',
                '&.Mui-focused': {
                  color: 'var(--color-primary)'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 'var(--spacing-lg)', pb: 'var(--spacing-lg)', gap: 'var(--spacing-sm)' }}>
          <Button 
            variant="contained" 
            onClick={handleApiKeyClear} 
            disabled={savingApiKey || !apiKey}
            sx={{
              backgroundColor: 'var(--color-warning)',
              color: 'var(--color-white)',
              '&:hover': { backgroundColor: 'var(--color-warning-dark)' },
              '&:disabled': { 
                backgroundColor: 'var(--color-text-disabled)',
                color: 'var(--color-text-muted)'
              },
              textTransform: 'var(--button-text-transform)',
              fontSize: 'var(--button-font-size)',
              fontWeight: 'var(--button-font-weight)',
              borderRadius: 'var(--button-border-radius)',
              px: 'var(--spacing-md)',
              py: 'var(--spacing-sm)'
            }}
          >
            Clear
          </Button>
          <Button 
            variant="contained" 
            onClick={handleApiKeyCancel} 
            disabled={savingApiKey}
            sx={{
              backgroundColor: 'var(--button-secondary-bg)',
              color: 'var(--button-secondary-color)',
              '&:hover': { backgroundColor: 'var(--button-secondary-hover-bg)' },
              textTransform: 'var(--button-text-transform)',
              fontSize: 'var(--button-font-size)',
              fontWeight: 'var(--button-font-weight)',
              borderRadius: 'var(--button-border-radius)',
              px: 'var(--spacing-md)',
              py: 'var(--spacing-sm)'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApiKeySave} 
            variant="contained"
            disabled={savingApiKey}
            startIcon={savingApiKey ? <CircularProgress size={16} /> : <CheckOutlined />}
            sx={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-white)',
              '&:hover': { backgroundColor: 'var(--color-primary-hover)' },
              '&:disabled': { 
                backgroundColor: 'var(--color-text-disabled)',
                color: 'var(--color-text-muted)'
              },
              textTransform: 'var(--button-text-transform)',
              fontSize: 'var(--button-font-size)',
              fontWeight: 'var(--button-font-weight)',
              borderRadius: 'var(--button-border-radius)',
              px: 'var(--spacing-md)',
              py: 'var(--spacing-sm)'
            }}
          >
            {savingApiKey ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PlanManagement;
