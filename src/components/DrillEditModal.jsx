import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import {
  CloseOutlined,
  SaveOutlined,
  AddOutlined,
  DeleteOutlined
} from '@mui/icons-material';

const DrillEditModal = ({ 
  open, 
  onClose, 
  drill, 
  onSave, 
  sessionIndex, 
  phaseIndex, 
  drillIndex 
}) => {
  const [editedDrill, setEditedDrill] = useState(null);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (drill) {
      setEditedDrill({ ...drill });
      setHasChanges(false);
      setErrors({});
    }
  }, [drill]);

  const handleFieldChange = (field, value) => {
    setEditedDrill(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleArrayFieldChange = (field, index, value) => {
    setEditedDrill(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
    setHasChanges(true);
  };

  const addArrayItem = (field) => {
    setEditedDrill(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
    setHasChanges(true);
  };

  const removeArrayItem = (field, index) => {
    setEditedDrill(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const validateDrill = () => {
    const newErrors = {};
    
    if (!editedDrill.name?.trim()) {
      newErrors.name = 'Drill name is required';
    }
    
    if (!editedDrill.duration || editedDrill.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 minute';
    }
    
    if (!editedDrill.objective_primary?.trim()) {
      newErrors.objective_primary = 'Primary objective is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateDrill()) {
      return;
    }
    
    onSave(editedDrill, sessionIndex, phaseIndex, drillIndex);
    setHasChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmed) return;
    }
    setHasChanges(false);
    onClose();
  };

  if (!editedDrill) return null;

  const intensityOptions = ['Low', 'Medium', 'High'];
  const loadOptions = ['Low', 'Medium', 'High'];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: 'var(--radius-lg)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border-primary)',
        pb: 2
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)'
        }}>
          Edit Drill
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseOutlined />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ 
              mb: 2,
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Drill Name"
              value={editedDrill.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={editedDrill.duration || ''}
              onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 0)}
              error={!!errors.duration}
              helperText={errors.duration}
              variant="outlined"
              inputProps={{ min: 1, max: 120 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Intensity</InputLabel>
              <Select
                value={editedDrill.intensity || editedDrill.load || 'Medium'}
                onChange={(e) => handleFieldChange('intensity', e.target.value)}
                label="Intensity"
              >
                {intensityOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Load</InputLabel>
              <Select
                value={editedDrill.load || 'Medium'}
                onChange={(e) => handleFieldChange('load', e.target.value)}
                label="Load"
              >
                {loadOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ 
              mb: 2,
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Objectives
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Primary Objective"
              value={editedDrill.objective_primary || editedDrill.goals || ''}
              onChange={(e) => handleFieldChange('objective_primary', e.target.value)}
              error={!!errors.objective_primary}
              helperText={errors.objective_primary}
              variant="outlined"
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Secondary Objectives
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => addArrayItem('objectives_secondary')}
                sx={{ color: 'var(--color-primary)' }}
              >
                <AddOutlined />
              </IconButton>
            </Box>
            {(editedDrill.objectives_secondary || []).map((objective, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={objective}
                  onChange={(e) => handleArrayFieldChange('objectives_secondary', index, e.target.value)}
                  placeholder="Secondary objective"
                  variant="outlined"
                />
                <IconButton 
                  size="small" 
                  onClick={() => removeArrayItem('objectives_secondary', index)}
                  sx={{ color: 'var(--color-error)' }}
                >
                  <DeleteOutlined />
                </IconButton>
              </Box>
            ))}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ 
              mb: 2,
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Setup & Instructions
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions"
              value={editedDrill.instructions || ''}
              onChange={(e) => handleFieldChange('instructions', e.target.value)}
              variant="outlined"
              multiline
              rows={4}
              placeholder="Describe how to set up and run the drill..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Equipment
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => addArrayItem('equipment')}
                sx={{ color: 'var(--color-primary)' }}
              >
                <AddOutlined />
              </IconButton>
            </Box>
            {(editedDrill.equipment || []).map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={item}
                  onChange={(e) => handleArrayFieldChange('equipment', index, e.target.value)}
                  placeholder="Equipment item"
                  variant="outlined"
                />
                <IconButton 
                  size="small" 
                  onClick={() => removeArrayItem('equipment', index)}
                  sx={{ color: 'var(--color-error)' }}
                >
                  <DeleteOutlined />
                </IconButton>
              </Box>
            ))}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Coaching Points
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => addArrayItem('coaching_points')}
                sx={{ color: 'var(--color-primary)' }}
              >
                <AddOutlined />
              </IconButton>
            </Box>
            {(editedDrill.coaching_points || []).map((point, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={point}
                  onChange={(e) => handleArrayFieldChange('coaching_points', index, e.target.value)}
                  placeholder="Key coaching point"
                  variant="outlined"
                />
                <IconButton 
                  size="small" 
                  onClick={() => removeArrayItem('coaching_points', index)}
                  sx={{ color: 'var(--color-error)' }}
                >
                  <DeleteOutlined />
                </IconButton>
              </Box>
            ))}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ 
              mb: 2,
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Advanced Settings
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Players Arrangement"
              value={editedDrill.players?.arrangement || ''}
              onChange={(e) => handleFieldChange('players', {
                ...editedDrill.players,
                arrangement: e.target.value
              })}
              variant="outlined"
              placeholder="e.g., 8v8, 4v4+2, Circle formation"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Space Dimensions"
              value={editedDrill.space?.dimensions || ''}
              onChange={(e) => handleFieldChange('space', {
                ...editedDrill.space,
                dimensions: e.target.value
              })}
              variant="outlined"
              placeholder="e.g., 20x30 yards, Half pitch"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Constraints
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => addArrayItem('constraints')}
                sx={{ color: 'var(--color-primary)' }}
              >
                <AddOutlined />
              </IconButton>
            </Box>
            {(editedDrill.constraints || []).map((constraint, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={constraint}
                  onChange={(e) => handleArrayFieldChange('constraints', index, e.target.value)}
                  placeholder="Rule or constraint"
                  variant="outlined"
                />
                <IconButton 
                  size="small" 
                  onClick={() => removeArrayItem('constraints', index)}
                  sx={{ color: 'var(--color-error)' }}
                >
                  <DeleteOutlined />
                </IconButton>
              </Box>
            ))}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ 
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Progressions
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => addArrayItem('progressions')}
                sx={{ color: 'var(--color-primary)' }}
              >
                <AddOutlined />
              </IconButton>
            </Box>
            {(editedDrill.progressions || []).map((progression, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={progression}
                  onChange={(e) => handleArrayFieldChange('progressions', index, e.target.value)}
                  placeholder="How to make it harder"
                  variant="outlined"
                />
                <IconButton 
                  size="small" 
                  onClick={() => removeArrayItem('progressions', index)}
                  sx={{ color: 'var(--color-error)' }}
                >
                  <DeleteOutlined />
                </IconButton>
              </Box>
            ))}
          </Grid>
        </Grid>

        {hasChanges && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You have unsaved changes. Don't forget to save your edits.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid var(--color-border-primary)',
        gap: 1
      }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderColor: 'var(--color-border-primary)',
            color: 'var(--color-text-secondary)'
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveOutlined />}
          sx={{
            backgroundColor: 'var(--color-primary)',
            '&:hover': { backgroundColor: 'var(--color-primary-hover)' }
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DrillEditModal;
