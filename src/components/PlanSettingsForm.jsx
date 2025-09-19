import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import { SettingsOutlined } from '@mui/icons-material';

const PlanSettingsForm = ({ 
  settings, 
  onSettingsChange, 
  disabled = false,
  showAsDialog = true,
  onClose = null 
}) => {
  const [localSettings, setLocalSettings] = useState(settings || {
    variability: 'medium',
    objective: '',
    generationMode: 'generative'
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const renderSettingsContent = () => {
    if (!localSettings) return null;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {disabled && (
          <Alert severity="info" variant="outlined" sx={{ fontSize: '12px' }}>
            These settings were applied to the current plan. Changes now will only affect the next generation. Regenerate to apply new values.
          </Alert>
        )}
        
        <Box>
          <Typography variant="subtitle2" gutterBottom>Variability (Model Flexibility)</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['low', 'medium', 'high'].map(level => {
              const active = localSettings.variability === level;
            return (
              <Chip 
                key={level} 
                clickable={!disabled} 
                disabled={disabled} 
                color={active ? 'primary' : 'default'} 
                label={level} 
                onClick={() => !disabled && handleSettingChange('variability', level)} 
                size="small" 
              />
            );
          })}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Controls how adventurous drill selection is (affects sampling temperature & diversity penalties).
        </Typography>
      </Box>
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>Plan Objective</Typography>
        <TextField
          placeholder="e.g. Improve high press & rapid transition to attack"
          value={localSettings.objective}
          onChange={(e) => !disabled && handleSettingChange('objective', e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={disabled}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Incorporated into AI summary & rationale generation.
        </Typography>
      </Box>
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>Drill Generation Mode</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { key: 'curated', label: 'Curated', tip: 'Only use vetted drills library (stable, repeatable).' },
            { key: 'hybrid', label: 'Hybrid', tip: 'Mix vetted drills with some AI-created drills (balanced).' },
            { key: 'generative', label: 'Generative', tip: 'Allow full AI creation of drills (novel, may need review).' }
          ].map(opt => {
            const active = localSettings.generationMode === opt.key;
            return (
              <Tooltip key={opt.key} title={opt.tip} arrow>
                <span>
                  <Chip
                    clickable={!disabled}
                    disabled={disabled}
                    color={active ? 'primary' : 'default'}
                    label={opt.label}
                    onClick={() => !disabled && handleSettingChange('generationMode', opt.key)}
                    size="small"
                    variant={active ? 'filled' : 'outlined'}
                  />
                </span>
              </Tooltip>
            );
          })}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Curated = safest. Hybrid = some novelty. Generative = maximum creativity (JSON-validated, may produce imperfect drills; edit as needed).
        </Typography>
      </Box>
      
    </Box>
    );
  };

  if (showAsDialog) {
    return (
      <>
        <Tooltip title="Plan settings">
          <Button
            variant="outlined"
            size="small"
            startIcon={<SettingsOutlined />}
            onClick={() => setOpen(true)}
            sx={{ 
              border: '1px solid var(--color-border-primary)', 
              backgroundColor: 'var(--color-background-secondary)',
              color: 'var(--color-text-primary)',
              '&:hover': {
                backgroundColor: 'var(--color-background-primary)',
                borderColor: 'var(--color-primary)'
              }
            }}
          >
            Settings
          </Button>
        </Tooltip>
        
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
          <DialogTitle>Plan Settings</DialogTitle>
          <DialogContent dividers>
            {renderSettingsContent()}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            <Button variant="contained" onClick={handleClose}>Done</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return renderSettingsContent();
};

export default PlanSettingsForm;
