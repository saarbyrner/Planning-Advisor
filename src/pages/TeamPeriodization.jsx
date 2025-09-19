import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Button, Card, Typography, Tab, Tabs, Select, MenuItem, Menu, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails, TextField, Drawer, IconButton, Grid, Paper, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DrillEditModal from '../components/DrillEditModal';
import squads from '../data/squads_teams.json'; // Add this import for team data
import games from '../data/games_matches.json';
import { BarChart } from '@mui/x-charts/BarChart'; // Existing usage
import { LineChart } from '@mui/x-charts/LineChart';
import { generateHighLevelTeamPlan, generateSessionDrills, regenerateSession, generateTeamPlan, updateDayLoad, markSessionNameEdited } from '../utils/generatePlan';
import { computePlanAnalytics } from '../utils/analytics';
import { saveTeamPlan, getTeamPlans, getAllTeamPlans, getTeamFixtures } from '../utils/supabase'; // Add import for new functions
import { useSearchParams } from 'react-router-dom';
import drillsList from '../data/drills.json'; // Add import for pre-defined drills
import principlesData from '../data/principles_of_play.json';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function TeamPeriodization({ onHeaderControlsChange }) {
  const [plan, setPlan] = useState(null);
  const [selectedSession, setSelectedSession] = useState(0); // Index of selected session
  const [loading, setLoading] = useState(false);
  const [generatingSessionIdx, setGeneratingSessionIdx] = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(1); // Default team ID
  const [savedPlans, setSavedPlans] = useState([]); // New state for loaded plans
  const [editingField, setEditingField] = useState(null); // Track editing: { sessionIdx, phaseIdx, drillIdx, field }
  const [openDrillPanel, setOpenDrillPanel] = useState(false);
  const [editingDrill, setEditingDrill] = useState(null); // { sessionIdx, phaseIdx, drillIdx, data }
  const [drillEditModalOpen, setDrillEditModalOpen] = useState(false);
  const [editingDrillData, setEditingDrillData] = useState(null);
  const [editingDrillContext, setEditingDrillContext] = useState(null);
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const isNewPlan = searchParams.get('new') === 'true';
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [regeneratingIdx, setRegeneratingIdx] = useState(null);
  const [planTitle, setPlanTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSessionName, setEditingSessionName] = useState(null); // Track which session is being edited
  // Removed showAllPrinciples toggle – only show focus principle tags inline per requirements
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [teamFixtures, setTeamFixtures] = useState([]); // State for fixtures from Supabase
  const tabsRef = useRef(null);
  const [openReport, setOpenReport] = useState(false);
  const [openSettings, setOpenSettings] = useState(false); // State for settings dialog
  const [loadEditAnchor, setLoadEditAnchor] = useState(null); // anchor for per-day load edit menu
  const [loadEditDayIndex, setLoadEditDayIndex] = useState(null);
  // Settings state
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('plan-settings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      variability: 'medium', // low | medium | high
      objective: '',
      selectedPrinciples: [], // array of principle names (cap 7)
      generationMode: 'curated' // curated | hybrid | generative
    };
  });
  const saveSettings = (next) => {
    setSettings(next);
    try { localStorage.setItem('plan-settings', JSON.stringify(next)); } catch {}
  };
  const variabilityNumeric = useMemo(() => settings.variability === 'high' ? 0.85 : settings.variability === 'low' ? 0.35 : 0.6, [settings.variability]);
  // Analytics memo: derives counts when plan updates
  const analytics = useMemo(() => {
    if (!plan || !plan.sessions) return null;
    return computePlanAnalytics(plan);
  }, [plan]);

  useEffect(() => {
    async function loadPlans() {
      if (isNewPlan) {
        // For new plan creation, don't load any existing plans
        setPlan(null);
        setSavedPlans([]);
        return;
      }
      
      if (planId) {
        // Load specific plan by ID
        console.log('Loading plan with ID:', planId, 'type:', typeof planId);
        const allPlans = await getAllTeamPlans();
        console.log('All plans:', allPlans);
        const specificPlan = allPlans.find(p => p.id == planId);
        console.log('Found specific plan:', specificPlan);
        if (specificPlan) {
          // Ensure principles_of_play injected if absent (older saved plans)
          const hydrated = specificPlan.plan.principles_of_play ? specificPlan.plan : { ...specificPlan.plan, principles_of_play: principlesData.principles_of_play };
          console.log('Setting plan:', hydrated);
          setPlan(hydrated);
          setSelectedTeamId(specificPlan.team_id);
          setPlanTitle(specificPlan.title || '');
          // Calculate weeks from timeline length
          if (specificPlan.plan.timeline) {
            setStartDate(specificPlan.plan.start_date || specificPlan.plan.startDate);
            setEndDate(specificPlan.plan.end_date || specificPlan.plan.endDate);
          }
        } else {
          console.log('Plan not found with ID:', planId);
          // Show error message to user
          setSnackbar({ 
            open: true, 
            message: `Plan with ID ${planId} not found. Please try generating a new plan.`, 
            severity: 'error' 
          });
        }
      } else {
        // Default behavior: don't load any plans automatically
        // User can generate a new plan or load existing ones manually
        setPlan(null);
        setSavedPlans([]);
      }
    }
    loadPlans();
  }, [selectedTeamId, planId, isNewPlan]);

  // Fetch fixtures from Supabase when team changes
  useEffect(() => {
    async function fetchFixtures() {
      try {
        const fixtures = await getTeamFixtures(selectedTeamId);
        setTeamFixtures(fixtures);
      } catch (error) {
        console.error('Error fetching fixtures:', error);
        setTeamFixtures([]);
      }
    }
    fetchFixtures();
  }, [selectedTeamId]);

  // Handlers that were previously defined after usage causing TDZ errors
  const handleSaveChanges = useCallback(async () => {
    if (plan) {
      await saveTeamPlan(selectedTeamId, plan, planTitle);
      setSnackbar({ open: true, message: 'Changes saved successfully!', severity: 'success' });
      const updatedPlans = await getTeamPlans(selectedTeamId);
      setSavedPlans(updatedPlans);
    }
  }, [plan, selectedTeamId, planTitle]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    let effectiveEnd = endDate;
    if (!effectiveEnd) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + 34);
      effectiveEnd = d.toISOString().split('T')[0];
      setEndDate(effectiveEnd);
    }
    const options = { 
      startDate, 
      endDate: effectiveEnd, 
      fixtures: teamFixtures,
      objective: settings.objective || undefined,
      variability: settings.variability,
      generationMode: settings.generationMode || 'curated',
      userSelectedPrinciples: settings.selectedPrinciples && settings.selectedPrinciples.length ? settings.selectedPrinciples : undefined
    };
    const generatedPlan = await generateHighLevelTeamPlan(selectedTeamId, options);
    if (generatedPlan.total_days && generatedPlan.total_days > 42) {
      setSnackbar({ open: true, message: 'Range truncated to max 42 days (6 weeks).', severity: 'warning' });
    }
    setPlan(generatedPlan);
    // Set default title for new plans
    if (!planTitle) {
      setPlanTitle(`${startDate} → ${effectiveEnd}`);
    }
    setLoading(false);
  }, [selectedTeamId, startDate, endDate, teamFixtures, settings]);

  const handleGenerateDrillsForSession = async (sessionIdx) => {
    if (!plan) return;
    setGeneratingSessionIdx(sessionIdx);
    try {
      const before = JSON.stringify(plan.sessions[sessionIdx]);
      await generateSessionDrills(plan, sessionIdx, { variability: settings.variability });
      const after = plan.sessions[sessionIdx];
      const anyDrills = after?.phases?.some(ph => ph.drills && ph.drills.length);
      setPlan({ ...plan, sessions: [...plan.sessions] });
      setSnackbar({ open: true, message: anyDrills ? `Drills generated for Session ${sessionIdx + 1}` : 'No drills generated (library filter returned empty).', severity: anyDrills ? 'success' : 'warning' });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Failed to generate drills: ' + (e.message||'error'), severity: 'error' });
    } finally {
      setGeneratingSessionIdx(null);
    }
  };

  const handleGenerateAllDrills = async () => {
    if (!plan) return;
    setGeneratingAll(true);
    let emptyCount = 0;
    for (let i = 0; i < plan.sessions.length; i++) {
      if (!plan.sessions[i].drills_generated) {
        try { 
          await generateSessionDrills(plan, i, { variability: settings.variability }); 
          const any = plan.sessions[i]?.phases?.some(ph => ph.drills && ph.drills.length);
          if (!any) emptyCount++;
        } catch (e) { console.warn('Drill gen failed for session', i, e); emptyCount++; }
      }
    }
    setPlan({ ...plan, sessions: [...plan.sessions] });
    setGeneratingAll(false);
    setSnackbar({ open: true, message: emptyCount ? `All sessions processed. ${emptyCount} had no drills.` : 'Drills generated for all sessions', severity: emptyCount ? 'warning' : 'success' });
  };

  const handleEditDrill = (drill, sessionIndex, phaseIndex, drillIndex) => {
    setEditingDrillData(drill);
    setEditingDrillContext({ sessionIndex, phaseIndex, drillIndex });
    setDrillEditModalOpen(true);
  };

  const handleSaveDrill = async (editedDrill, sessionIndex, phaseIndex, drillIndex) => {
    if (!plan) return;
    
    const updatedPlan = { ...plan };
    updatedPlan.sessions = [...updatedPlan.sessions];
    updatedPlan.sessions[sessionIndex] = { ...updatedPlan.sessions[sessionIndex] };
    updatedPlan.sessions[sessionIndex].phases = [...updatedPlan.sessions[sessionIndex].phases];
    updatedPlan.sessions[sessionIndex].phases[phaseIndex] = { 
      ...updatedPlan.sessions[sessionIndex].phases[phaseIndex] 
    };
    updatedPlan.sessions[sessionIndex].phases[phaseIndex].drills = [
      ...updatedPlan.sessions[sessionIndex].phases[phaseIndex].drills
    ];
    updatedPlan.sessions[sessionIndex].phases[phaseIndex].drills[drillIndex] = editedDrill;
    
    setPlan(updatedPlan);
    
    // Auto-save the plan to persist the drill changes
    try {
      await saveTeamPlan(selectedTeamId, updatedPlan, planTitle);
      setSnackbar({ 
        open: true, 
        message: 'Drill updated and saved successfully', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error saving drill changes:', error);
      setSnackbar({ 
        open: true, 
        message: 'Drill updated but failed to save. Please save manually.', 
        severity: 'warning' 
      });
    }
  };

  const handleCloseDrillEditModal = () => {
    setDrillEditModalOpen(false);
    setEditingDrillData(null);
    setEditingDrillContext(null);
  };

  // Create header controls for team planning (depends on handlers above)
  const createHeaderControls = useCallback(() => {
    return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
        <FormControl variant="filled" size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Squad</InputLabel>
          <Select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            label="Squad"
          >
            {squads.map(team => (
              <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Date range inputs */}
        <TextField
          label="Start Date"
          type="date"
          size="small"
          variant="filled"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          size="small"
          variant="filled"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Tooltip title="Plan settings (apply before Generate)">
          <span>
            <IconButton
              size="small"
              color="default"
              onClick={() => setOpenSettings(true)}
              sx={{ border: '1px solid var(--color-border-primary)', background:'var(--color-background-secondary)' }}
            >
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
        <Button 
          variant="contained" 
          onClick={handleGenerate} 
          disabled={loading}
          sx={{ 
            backgroundColor: 'var(--button-primary-bg)', 
            color: 'var(--button-primary-color)', 
            '&:hover': { backgroundColor: 'var(--button-primary-hover-bg)' }, 
            textTransform: 'none',
            fontWeight: 'var(--font-weight-medium)',
            px: 'var(--spacing-lg)',
            py: 'var(--spacing-sm)'
          }}
        >Generate</Button>
        <Button 
          variant="contained" 
          onClick={handleSaveChanges} 
          disabled={!plan || loading}
          sx={{ 
            backgroundColor: 'var(--button-secondary-bg)', 
            color: 'var(--button-secondary-color)', 
            '&:hover': { backgroundColor: 'var(--button-secondary-hover-bg)' }, 
            textTransform: 'none',
            fontWeight: 'var(--font-weight-medium)',
            px: 'var(--spacing-lg)',
            py: 'var(--spacing-sm)'
          }}
        >Save</Button>
      </Box>
    </Box>
    );
  }, [selectedTeamId, loading, plan, handleGenerate, handleSaveChanges, startDate, endDate]);

  // Set header controls when component mounts or when dependencies change
  useEffect(() => {
    if (onHeaderControlsChange) {
      onHeaderControlsChange(createHeaderControls());
    }
    
    // Cleanup: clear header controls when component unmounts
    return () => {
      if (onHeaderControlsChange) {
        onHeaderControlsChange(null);
      }
    };
  }, [onHeaderControlsChange, createHeaderControls]);

  const handleEditField = (sessionIdx, phaseIdx, drillIdx, field, value) => {
    const updatedPlan = { ...plan };
    
    if (drillIdx !== undefined) {
      // Editing a drill
      updatedPlan.sessions = updatedPlan.sessions.map((session, sIdx) => 
        sIdx === sessionIdx 
          ? {
              ...session,
              phases: session.phases.map((phase, pIdx) =>
                pIdx === phaseIdx
                  ? {
                      ...phase,
                      drills: phase.drills.map((drill, dIdx) =>
                        dIdx === drillIdx
                          ? { ...drill, [field]: value }
                          : drill
                      )
                    }
                  : phase
              )
            }
          : session
      );
    } else if (phaseIdx !== undefined) {
      // Editing a phase
      updatedPlan.sessions = updatedPlan.sessions.map((session, sIdx) => 
        sIdx === sessionIdx 
          ? {
              ...session,
              phases: session.phases.map((phase, pIdx) =>
                pIdx === phaseIdx
                  ? { ...phase, [field]: value }
                  : phase
              )
            }
          : session
      );
    } else {
      // Editing a session
      updatedPlan.sessions = updatedPlan.sessions.map((session, sIdx) => 
        sIdx === sessionIdx 
          ? { ...session, [field]: value }
          : session
      );
    }
    
    setPlan(updatedPlan);
  };

  const toggleEdit = (sessionIdx, phaseIdx, drillIdx, field) => {
    setEditingField({ sessionIdx, phaseIdx, drillIdx, field });
  };

  // (removed duplicate later definitions moved above)

  const handleSave = async () => {
    if (plan) {
      await saveTeamPlan(selectedTeamId, plan, planTitle);
      setSnackbar({ open: true, message: 'Plan saved successfully!', severity: 'success' });
      // Reload saved plans
      const updatedPlans = await getTeamPlans(selectedTeamId);
      setSavedPlans(updatedPlans);
    }
  };

  const toggleDrillPanel = (sessionIdx, phaseIdx, drillIdx) => {
    setEditingDrill({
      sessionIdx,
      phaseIdx,
      drillIdx,
      data: { ...plan.sessions[sessionIdx].phases[phaseIdx].drills[drillIdx] }
    });
    setOpenDrillPanel(true);
  };

  const handleDrillChange = (field, value) => {
    setEditingDrill(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }));
  };

  const saveDrillChanges = () => {
    const { sessionIdx, phaseIdx, drillIdx, data } = editingDrill;
    const updatedPlan = { ...plan };
    updatedPlan.sessions[sessionIdx].phases[phaseIdx].drills[drillIdx] = data;
    setPlan(updatedPlan);
    setOpenDrillPanel(false);
  };

  const handleRegenerateDay = async (idx) => {
    if (!plan || !plan.timeline) return;
    setRegeneratingIdx(idx);
    try {
      const newSession = await regenerateSession(plan, idx);
      const updated = { ...plan, sessions: [...plan.sessions] };
      updated.sessions[idx] = newSession;
      setPlan(updated);
      setSnackbar({ open: true, message: `Day ${idx + 1} regenerated`, severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to regenerate day', severity: 'error' });
    } finally {
      setRegeneratingIdx(null);
    }
  };

  const handleTitleEdit = () => {
    setEditingTitle(true);
  };

  const handleTitleSave = () => {
    setEditingTitle(false);
    // Title will be saved when the user clicks the main Save button
  };

  const handleTitleCancel = () => {
    setEditingTitle(false);
  };

  const handleSessionNameEdit = (sessionIndex) => {
    setEditingSessionName(sessionIndex);
  };

  const handleSessionNameSave = () => {
    setEditingSessionName(null);
    // Session name will be saved when the user clicks the main Save button
  };

  const handleSessionNameCancel = () => {
    setEditingSessionName(null);
  };


  // Check if tabs need scroll buttons
  const checkScrollButtons = useCallback(() => {
    if (tabsRef.current) {
      const container = tabsRef.current.querySelector('.MuiTabs-scrollableX');
      if (container) {
        const needsScroll = container.scrollWidth > container.clientWidth;
        setShowScrollButtons(needsScroll);
      }
    }
  }, []);

  // Check for overflow when plan changes or window resizes
  useEffect(() => {
    if (plan && plan.timeline) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(checkScrollButtons, 100);
    }
  }, [plan, checkScrollButtons]);

  useEffect(() => {
    const handleResize = () => {
      checkScrollButtons();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScrollButtons]);

  return (
    <Box
      sx={{
        px: 'var(--spacing-lg)', // 24px horizontal margins
        pt: 'var(--spacing-md)', // 16px top spacing below header
        pb: 'var(--spacing-xl)',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {plan && plan.summary && (
        <Card
          sx={{
            p: 0,
            mb: '16px',
            backgroundColor: 'var(--color-background-primary)',
            border: 'none',
            borderRadius: 0,
            boxShadow: 'none',
            width: '100%'
          }}
        >
          <Box sx={{ p: 0 }}>
            {/* Block Title and Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            {editingTitle ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}>
                <TextField
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  variant="standard"
                  fullWidth
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleSave();
                    } else if (e.key === 'Escape') {
                      handleTitleCancel();
                    }
                  }}
                  sx={{ 
                    '& .MuiInput-underline:before': { borderBottomColor: 'var(--color-border-primary)' },
                    '& .MuiInput-underline:after': { borderBottomColor: 'var(--color-primary)' },
                    '& .MuiInputBase-input': { 
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)'
                    }
                  }}
                />
                <IconButton onClick={handleTitleSave} size="small" color="primary">
                  <CheckOutlinedIcon />
                </IconButton>
                <IconButton onClick={handleTitleCancel} size="small" color="error">
                  <CloseOutlinedIcon />
                </IconButton>
              </Box>
            ) : (
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'var(--font-weight-medium)', 
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={handleTitleEdit}
              >
                {planTitle || `${startDate} → ${endDate || 'set end date'}`}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              {!editingTitle && (
                <EditOutlinedIcon 
                  sx={{ fontSize: 'small', color: 'var(--color-text-muted)', cursor: 'pointer' }} 
                  onClick={handleTitleEdit}
                />
              )}
              {plan && (
                <Tooltip title="Plan analytics report">
                  <span>
                    <IconButton size="small" onClick={()=> setOpenReport(true)}>
                      <AssessmentOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            {/* Settings button moved to global header controls */}
              {/* Moved Generate All Drills button here */}
              {plan?.sessions && plan.sessions.some(s => !s.drills_generated) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleGenerateAllDrills}
                  disabled={generatingAll}
                  sx={{ textTransform: 'none', fontSize: 'var(--font-size-xs)', ml: 'var(--spacing-sm)' }}
                >{generatingAll ? 'Populating…' : `Generate all drills (${plan.sessions.filter(s => !s.drills_generated).length})`}</Button>
              )}
            </Box>
          </Box>
          {/* Date, Intensity & Focus Principles (inline tags) */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)', mb: 'var(--spacing-lg)' }}>
            <Typography variant="body1" color="text.secondary" sx={{ mr: 'var(--spacing-sm)' }}>
              {plan.sessions && plan.sessions[0] ? new Date(plan.sessions[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} - {plan.sessions && plan.sessions[plan.sessions.length - 1] ? new Date(plan.sessions[plan.sessions.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
            </Typography>
            {/* Overall intensity chip (placeholder / could be computed) */}
            <Chip 
              label="Medium" 
              size="small"
              sx={{ 
                backgroundColor: 'var(--color-warning)', 
                color: 'var(--color-white)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                height: 24
              }}
            />
            {/* Focus Principle Tags */}
            {(() => {
              if (!plan.focus_principles || !principlesData?.principles_of_play) return null;
              // Build lookup for descriptions
              const descLookup = {};
              ['attacking','defending','transition'].forEach(section => {
                const arr = principlesData.principles_of_play[section] || [];
                arr.forEach(p => { descLookup[p.name] = p.description; });
              });
              // Flatten focus principle names preserving section grouping
              const ordered = [];
              ['attacking','defending','transition'].forEach(section => {
                const names = plan.focus_principles[section] || [];
                names.forEach(n => ordered.push({ name: n, section }));
              });
              if (ordered.length === 0) return null;
              return ordered.map(({ name, section }, idx) => (
                <Tooltip key={idx} title={descLookup[name] || ''} arrow>
                  <Chip
                    size="small"
                    label={name}
                    sx={(theme) => ({
                      backgroundColor: theme.palette.grey[200],
                      color: 'var(--color-text-primary)',
                      fontSize: '10px',
                      fontWeight: 'var(--font-weight-medium)',
                      height: 22,
                      borderRadius: '4px',
                      '& .MuiChip-label': { px: 1 }
                    })}
                  />
                </Tooltip>
              ));
            })()}
          </Box>

           {/* Plan Summary Accordion */}
           <Accordion disableGutters square sx={{ boxShadow: 'none', border: '1px solid var(--color-border-primary)', width: '100%', '&:before': { display: 'none' }, backgroundColor: 'var(--color-background-primary)', mt: 'var(--spacing-md)' }}>
             <AccordionSummary
               expandIcon={<ExpandMoreOutlinedIcon />}
               sx={{ 
                 px: 'var(--spacing-md)',
                 '& .MuiAccordionSummary-content': {
                   my: 'var(--spacing-sm)',
                   margin: 0,
                   alignItems: 'center'
                 }
               }}
             >
               <Typography variant="h6" sx={{ color: 'var(--color-text-primary)' }}>Plan summary</Typography>
             </AccordionSummary>
             <AccordionDetails sx={{ px: 'var(--spacing-md)', pt:0, pb: 'var(--spacing-md)' }}>
               <Typography variant="body1" sx={{ color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-relaxed)' }}>
                 {plan.summary}
               </Typography>
               {plan.warnings && plan.warnings.length > 0 && (
                 <Box sx={{ mt: 'var(--spacing-md)' }}>
                   <Typography variant="subtitle2" color="warning.main" sx={{ mb: 'var(--spacing-xs)' }}>Generation warnings</Typography>
                   {plan.warnings.map((w, i) => (
                     <Typography key={i} variant="caption" display="block" color="warning.main">• {w}</Typography>
                   ))}
                 </Box>
               )}
             </AccordionDetails>
           </Accordion>
            {/* Removed Principles of Play accordion: focus principles now displayed inline as tags above */}
          </Box>
        </Card>
      )}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Loading plan...</Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            Please wait while we load your training plan.
          </Typography>
        </Box>
      )}
      {!loading && !plan && planId && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'var(--color-error)' }}>
            Plan Not Found
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 3 }}>
            The plan with ID {planId} could not be found. It may have been deleted or the link is incorrect.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.href = '/ideal-mvp'}
            sx={{ textTransform: 'none' }}
          >
            Generate New Plan
          </Button>
        </Box>
      )}
      {!loading && !plan && !planId && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            No Plan Loaded
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 3 }}>
            Generate a new training plan or load an existing one to get started.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.href = '/ideal-mvp'}
            sx={{ textTransform: 'none' }}
          >
            Generate New Plan
          </Button>
        </Box>
      )}
      {plan && (
        <>
          {typeof plan === 'object' && plan.timeline && plan.sessions ? (
            <>
              <Box sx={{ width: '100%', mb: 'var(--spacing-lg)' }}>
                <Tabs
                  ref={tabsRef}
                  value={selectedSession}
                  onChange={(event, newValue) => setSelectedSession(newValue)}
                  variant="scrollable"
                  scrollButtons={showScrollButtons ? "auto" : false}
                  aria-label="Day selector"
                  sx={{
                    '& .MuiTabs-indicator': {
                      display: 'none'
                    },
                    '& .MuiTabs-flexContainer': {
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-md) var(--spacing-sm)'
                    },
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-sm)',
                      minWidth: 110,
                      maxWidth: 130,
                      px: 'var(--spacing-xs)',
                      py: 'var(--spacing-sm)',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      backgroundColor: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)',
                      height: 90,
                      overflow: 'visible',
                      '&.Mui-selected': {
                        backgroundColor: 'var(--color-background-secondary)',
                        border: '2px solid var(--color-primary)',
                        color: 'var(--color-text-primary)',
                        opacity: 1,
                        transform: 'scale(1.05)'
                      },
                      '&:hover': {
                        backgroundColor: 'var(--color-background-secondary)',
                        transform: 'scale(1.02)'
                      },
                      transition: 'all 0.2s ease'
                    }
                  }}
                >
                  {plan.timeline.map((day, index) => {
                    const sess = plan.sessions[index];
                    const status = sess?.drills_generated ? 'ready' : 'pending';
                    const dayDate = sess?.date ? new Date(sess.date) : new Date();
                    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNumber = dayDate.getDate();
                    const monthName = dayDate.toLocaleDateString('en-US', { month: 'short' });
                    
                    return (
                      <Tab
                        key={index}
                        label={
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: 0.5,
                            position: 'relative',
                            minHeight: 70,
                            justifyContent: 'center',
                            width: '100%',
                            padding: '4px 0'
                          }}>
                            {day.isFixture && (
                              <Tooltip title={`Match ${day.fixture?.match_number || ''} • Importance ${(day.fixture?.importance_weight||1).toFixed(2)}`} arrow>
                                <Box sx={{
                                  position:'absolute',
                                  top:4,
                                  right:4,
                                  px:0.5,
                                  minWidth:20,
                                  height:18,
                                  borderRadius:'10px',
                                  display:'flex',
                                  alignItems:'center',
                                  justifyContent:'center',
                                  fontSize:'10px',
                                  fontWeight:600,
                                  background: (day.fixture?.importance_weight||1) > 1.3 ? 'linear-gradient(90deg,#8e24aa,#d81b60)' : (day.fixture?.importance_weight||1) > 1.15 ? '#1976d2' : '#455a64',
                                  color:'#fff',
                                  boxShadow:'0 0 0 2px rgba(0,0,0,0.15)'
                                }}>
                                  {day.fixture?.match_number || 'M'}
                                </Box>
                              </Tooltip>
                            )}
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '10px', 
                                fontWeight: 'var(--font-weight-medium)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                opacity: 0.8
                              }}>
                                {dayName}
                              </Typography>
                              <Typography variant="h6" sx={{ 
                                fontSize: '18px', 
                                fontWeight: 'var(--font-weight-semibold)',
                                lineHeight: 1
                              }}>
                                {dayNumber}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                fontSize: '9px', 
                                opacity: 0.7,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {monthName}
                              </Typography>
                            </Box>
                            <Tooltip title={(() => {
                              if (day.isFixture) return day.label;
                              const base = day.md_label ? `${day.md_label}${day.mesocycle_phase? ' • '+day.mesocycle_phase:''}` : (day.mesocycle_phase||'');
                              // If upcoming fixture high importance and within 3 days, append importance flag
                              const upcoming = plan.timeline.find(d2 => d2.isFixture && new Date(d2.date) >= new Date(day.date));
                              if (upcoming && upcoming.fixture?.importance_weight > 1.15) {
                                const diff = (new Date(upcoming.date) - new Date(day.date))/86400000;
                                if (diff > 0 && diff <=3) return base + ` • Targeting High-Importance Match (Iw ${(upcoming.fixture.importance_weight).toFixed(2)})`;
                              }
                              return base;
                            })()} arrow disableInteractive>
                              <Chip
                                size="small"
                                onClick={(e)=> { if(!day.isFixture){ setLoadEditAnchor(e.currentTarget); setLoadEditDayIndex(index);} }}
                                label={day.isFixture ? (day.fixture?.opponent || day.label.replace(/Match vs\s*/i,'').split('(')[0].trim()) : (
                                  day.load_class || (day.label.includes('High') ? 'High' : day.label.includes('Medium') ? 'Medium' : day.label.includes('Low') ? 'Low' : day.label.includes('Recovery') ? 'Recovery' : 'Load')
                                )}
                                variant="filled"
                                sx={{
                                  height: 22,
                                  cursor: day.isFixture? 'default':'pointer',
                                  fontSize: '10px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  backgroundColor: day.color === 'red' ? 'var(--color-error,#d32f2f)' :
                                                 day.color === 'yellow' ? 'var(--color-warning,#ed6c02)' :
                                                 day.color === 'green' ? 'var(--color-success,#2e7d32)' :
                                                 day.color === 'purple' ? '#6a1b9a' : 'var(--color-primary,#1976d2)',
                                  color: (day.color === 'yellow') ? 'var(--color-text-primary)' : 'var(--color-white)',
                                  border: 'none',
                                  boxShadow: 'none',
                                  '& .MuiChip-label': { px: 1.25, py: 0.5 }
                                }}
                              />
                            </Tooltip>
                          </Box>
                        }
                        sx={{
                          // Individual tab styling is now handled at the container level
                        }}
                        value={index}
                      />
                    );
                  })}
                </Tabs>
              </Box>
              {plan.sessions.length > 0 && plan.sessions[selectedSession] ? ( // Added check for defined session
                <Box>
                  {/* Session Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
                    {editingSessionName === selectedSession ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}>
                        <Typography variant="h5" sx={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                          Session {selectedSession + 1}:
                        </Typography>
                        <TextField
                          value={plan.sessions[selectedSession].name}
                          onChange={(e) => handleEditField(selectedSession, null, null, 'name', e.target.value)}
                          variant="standard"
                          fullWidth
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSessionNameSave();
                            } else if (e.key === 'Escape') {
                              handleSessionNameCancel();
                            }
                          }}
                          sx={{ 
                            '& .MuiInput-underline:before': { borderBottomColor: 'var(--color-border-primary)' },
                            '& .MuiInput-underline:after': { borderBottomColor: 'var(--color-primary)' },
                            '& .MuiInputBase-input': { 
                              fontSize: 'var(--font-size-lg)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--color-text-primary)'
                            }
                          }}
                        />
                        <IconButton onClick={handleSessionNameSave} size="small" color="primary">
                          <CheckOutlinedIcon />
                        </IconButton>
                        <IconButton onClick={handleSessionNameCancel} size="small" color="error">
                          <CloseOutlinedIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: 'var(--color-text-primary)', 
                          fontWeight: 'var(--font-weight-semibold)',
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 }
                        }}
                        onClick={() => handleSessionNameEdit(selectedSession)}
                      >
                        Session {selectedSession + 1}: {plan.sessions[selectedSession].name}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      {editingSessionName !== selectedSession && (
                        <EditOutlinedIcon 
                          sx={{ fontSize: 'small', color: 'var(--color-text-muted)', cursor: 'pointer' }} 
                          onClick={() => handleSessionNameEdit(selectedSession)}
                        />
                      )}
                      <Tooltip title={plan.sessions[selectedSession].drills_generated ? 'Drills ready' : 'Generate drills for this session'}>
                        <span>
                        <Button
                          variant={plan.sessions[selectedSession].drills_generated ? 'outlined' : 'contained'}
                          size="small"
                          onClick={() => plan.sessions[selectedSession].drills_generated ? handleRegenerateDay(selectedSession) : handleGenerateDrillsForSession(selectedSession)}
                          disabled={regeneratingIdx === selectedSession || generatingSessionIdx === selectedSession || loading}
                          sx={{ textTransform: 'none', fontSize: 'var(--font-size-xs)' }}
                        >
                          {regeneratingIdx === selectedSession ? 'Regenerating…' : generatingSessionIdx === selectedSession ? 'Generating…' : plan.sessions[selectedSession].drills_generated ? 'Regenerate' : 'Generate drills'}
                        </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>

                   {/* Drill Items */}
                   {plan.sessions[selectedSession].phases.map((phase, pIdx) => (
                     <Accordion 
                       key={pIdx} 
                       disableGutters 
                       square
                       sx={{ 
                         mb: 'var(--spacing-md)', 
                         border: '1px solid var(--color-border-primary)', 
                         backgroundColor: 'var(--color-background-primary)', 
                         boxShadow: 'none', 
                         width: '100%',
                         '&:before': { display: 'none' }
                       }}
                     >
                       <AccordionSummary
                         expandIcon={<ExpandMoreOutlinedIcon />}
                         sx={{ 
                           px: 'var(--spacing-md)',
                           '& .MuiAccordionSummary-content': {
                             my: 'var(--spacing-sm)',
                             margin: 0,
                             alignItems: 'center'
                           }
                         }}
                       >
                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                             <Typography variant="h6" sx={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                               {editingField?.sessionIdx === selectedSession && editingField?.phaseIdx === pIdx && editingField?.field === 'name' ? (
                                 <TextField
                                   value={phase.name}
                                   onChange={(e) => handleEditField(selectedSession, pIdx, null, 'name', e.target.value)}
                                   onBlur={() => setEditingField(null)}
                                   autoFocus
                                   variant="standard"
                                   sx={{ 
                                     '& .MuiInput-underline:before': { borderBottomColor: 'var(--color-border-primary)' },
                                     '& .MuiInput-underline:after': { borderBottomColor: 'var(--color-primary)' }
                                   }}
                                 />
                               ) : (
                                 <span onClick={(e) => { e.stopPropagation(); toggleEdit(selectedSession, pIdx, null, 'name'); }}>{phase.name}</span>
                               )}
                             </Typography>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                               {phase.duration && (
                                 <Typography variant="body2" color="text.secondary">
                                   {phase.duration} mins
                                 </Typography>
                               )}
                               <Chip 
                                 label={(phase.intensity || phase.target_intensity || 'N/A')} 
                                 size="small"
                                 sx={{ 
                                   backgroundColor: (phase.intensity || phase.target_intensity) === 'High' ? 'var(--color-error)' : 
                                                  (phase.intensity || phase.target_intensity) === 'Medium' ? 'var(--color-warning)' : 'var(--color-success)', 
                                   color: 'var(--color-white)',
                                   fontSize: 'var(--font-size-xs)',
                                   fontWeight: 'var(--font-weight-medium)',
                                   height: 24
                                 }}
                               />
                             </Box>
                           </Box>
                           <EditOutlinedIcon 
                             onClick={(e) => { e.stopPropagation(); toggleEdit(selectedSession, pIdx, null, 'name'); }} 
                             sx={{ fontSize: 'small', color: 'var(--color-text-muted)', cursor: 'pointer' }} 
                           />
                         </Box>
                       </AccordionSummary>
                       <AccordionDetails sx={{ px: 'var(--spacing-md)', pt:0, pb: 'var(--spacing-md)' }}>
                         {phase.focus && (
                           <Typography variant="body2" color="text.secondary" sx={{ mb: 'var(--spacing-sm)' }}>
                             {phase.focus}
                           </Typography>
                         )}
                         {phase.description && (
                           <Typography variant="body2" color="text.secondary" sx={{ mb: 'var(--spacing-sm)' }}>
                             {phase.description}
                           </Typography>
                         )}
                         {phase.goals && (
                           <Typography variant="body2" sx={{ mb: 'var(--spacing-sm)' }}>
                             <strong>Goals:</strong> {phase.goals}
                           </Typography>
                         )}
                         {phase.drills && phase.drills.length > 0 && (
                           <Box sx={{ mt: 'var(--spacing-md)' }}>
                             {phase.drills.map((drill, dIdx) => {
                               // Parse enriched instructions into structured format
                               const parseDrillDetails = (instructions) => {
                                 if (!instructions) return [];
                                 
                                 const sections = [];
                                 const lines = instructions.split('\n').filter(line => line.trim());
                                 
                                 lines.forEach(line => {
                                   const trimmed = line.trim();
                                   if (trimmed.startsWith('Objective:')) {
                                     sections.push({ label: 'Objective', content: trimmed.replace('Objective:', '').trim() });
                                   } else if (trimmed.startsWith('Secondary:')) {
                                     sections.push({ label: 'Secondary', content: trimmed.replace('Secondary:', '').trim() });
                                   } else if (trimmed.startsWith('Players:')) {
                                     sections.push({ label: 'Players', content: trimmed.replace('Players:', '').trim() });
                                   } else if (trimmed.startsWith('Space:')) {
                                     sections.push({ label: 'Space', content: trimmed.replace('Space:', '').trim() });
                                   } else if (trimmed.startsWith('Equipment:')) {
                                     sections.push({ label: 'Equipment', content: trimmed.replace('Equipment:', '').trim() });
                                   } else if (trimmed.startsWith('Coaching Points:')) {
                                     sections.push({ label: 'Coaching Points', content: trimmed.replace('Coaching Points:', '').trim() });
                                   } else if (trimmed.startsWith('Constraints:')) {
                                     sections.push({ label: 'Constraints', content: trimmed.replace('Constraints:', '').trim() });
                                   } else if (trimmed.startsWith('Progressions:')) {
                                     sections.push({ label: 'Progressions', content: trimmed.replace('Progressions:', '').trim() });
                                   } else if (trimmed.startsWith('Regressions:')) {
                                     sections.push({ label: 'Regressions', content: trimmed.replace('Regressions:', '').trim() });
                                   }
                                 });
                                 
                                 return sections;
                               };

                               const drillSections = drill.enriched_instructions ? parseDrillDetails(drill.enriched_instructions) : [];

                               return (
                                 <Box key={dIdx} sx={{ mb: 'var(--spacing-sm)', p: 'var(--spacing-sm)', backgroundColor: 'var(--color-background-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                                     <Typography component="span" variant="body2" sx={{ fontWeight: 'var(--font-weight-medium)' }}>
                                       {drill.name} ({drill.duration} mins)
                                     </Typography>
                                     <Tooltip title="Edit drill">
                                       <IconButton 
                                         size="small"
                                         onClick={() => handleEditDrill(drill, selectedSession, pIdx, dIdx)}
                                         sx={{ 
                                           color: 'var(--color-primary)',
                                           '&:hover': { backgroundColor: 'var(--color-primary-light)' }
                                         }}
                                       >
                                         <EditOutlinedIcon fontSize="small" />
                                       </IconButton>
                                     </Tooltip>
                                   </Box>
                                   
                                   {drillSections.length > 0 ? (
                                     <Box sx={{ mt: 'var(--spacing-xs)' }}>
                                       {drillSections.map((section, sIdx) => (
                                         <Typography key={sIdx} variant="body2" color="text.secondary" sx={{ fontSize: 'var(--font-size-xs)', mb: '2px' }}>
                                           <strong>{section.label}:</strong> {section.content}
                                         </Typography>
                                       ))}
                                     </Box>
                                   ) : (
                                     <Typography variant="body2" component="div" color="text.secondary" sx={{ fontSize: 'var(--font-size-sm)', mt: '2px' }}>
                                       {drill.instructions}
                                     </Typography>
                                   )}
                                 </Box>
                               );
                             })}
                           </Box>
                         )}
                         {!phase.drills && plan.sessions[selectedSession].drills_generated === false && (
                           <Typography variant="caption" color="text.secondary">No drills yet. Generate drills to populate this phase.</Typography>
                         )}
                       </AccordionDetails>
                     </Accordion>
                   ))}
                   {/* Removed duplicate bottom buttons to reduce clutter */}
                </Box>
              ) : (
                <Typography>No session available for this day. It might be a rest or recovery day.</Typography> // Fallback message
              )}
            </>
          ) : (
            <Typography color="error">Error generating plan: {typeof plan === 'string' ? plan : 'Invalid plan format'}</Typography>
          )}
        </>
      )}
      <Drawer
        anchor="right"
        open={openDrillPanel}
        onClose={() => setOpenDrillPanel(false)}
      >
        <Box sx={{ width: 300, p: 'var(--spacing-md)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit drill</Typography>
            <IconButton onClick={() => setOpenDrillPanel(false)}>
              <CloseOutlinedIcon />
            </IconButton>
          </Box>
          {editingDrill && (
            <Grid container spacing={'var(--spacing-md)'} sx={{ mt: 'var(--spacing-md)' }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Choose existing drill</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => {
                      const selected = drillsList.find(d => d.name === e.target.value);
                      if (selected) {
                        setEditingDrill(prev => ({ ...prev, data: { ...selected } }));
                      }
                    }}
                  >
                    {drillsList.map((drill, idx) => (
                      <MenuItem key={idx} value={drill.name}>{drill.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 'var(--spacing-sm)', mb: 'var(--spacing-md)' }}>
                  <Typography variant="subtitle1">Setup</Typography>
                  <TextField
                    label="Visual description"
                    multiline
                    rows={2}
                    value={editingDrill.data.visual || ''}
                    onChange={(e) => handleDrillChange('visual', e.target.value)}
                    fullWidth
                    sx={{ mt: 'var(--spacing-sm)' }}
                  />
                  <TextField
                    label="Equipment"
                    value={editingDrill.data.equipment || ''}
                    onChange={(e) => handleDrillChange('equipment', e.target.value)}
                    fullWidth
                    sx={{ mt: 'var(--spacing-sm)' }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 'var(--spacing-sm)', mb: 'var(--spacing-md)' }}>
                  <Typography variant="subtitle1">Objectives</Typography>
                  <TextField
                    label="Goals"
                    value={editingDrill.data.goals || ''}
                    onChange={(e) => handleDrillChange('goals', e.target.value)}
                    fullWidth
                  />
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  value={editingDrill.data.name}
                  onChange={(e) => handleDrillChange('name', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Duration (min)"
                  type="number"
                  value={editingDrill.data.duration}
                  onChange={(e) => handleDrillChange('duration', parseInt(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Intensity (load)</InputLabel>
                  <Select
                    value={editingDrill.data.load}
                    onChange={(e) => handleDrillChange('load', e.target.value)}
                  >
                    <MenuItem value="Light">Light</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Staff"
                  value={editingDrill.data.staff}
                  onChange={(e) => handleDrillChange('staff', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Instructions"
                  multiline
                  rows={4}
                  value={editingDrill.data.instructions}
                  onChange={(e) => handleDrillChange('instructions', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Button 
  variant="contained" 
  onClick={saveDrillChanges} 
  fullWidth 
  sx={{ 
    backgroundColor: 'var(--button-primary-bg)', 
    color: 'var(--button-primary-color)', 
    '&:hover': { backgroundColor: 'var(--button-primary-hover-bg)' }, 
    textTransform: 'none' 
  }}
>Save drill</Button>
              </Grid>
            </Grid>
          )}
        </Box>
      </Drawer>
      <Dialog open={openReport} onClose={()=>setOpenReport(false)} fullWidth maxWidth="md">
        <DialogTitle>Plan Analytics Report</DialogTitle>
        <DialogContent dividers>
          {!analytics && (<Typography variant="body2">Generate drills to populate analytics.</Typography>)}
          {analytics && (
            <Box sx={{ display:'flex', flexDirection:'column', gap:4 }}>
              {/* Load Undulation Visuals */}
              <Box>
                <Typography variant="h6" sx={{ mb:1, fontSize:'14px' }}>Load Undulation</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display:'block', mb:2 }}>
                  Visualizing daily and weekly training load to evidence periodized variation (reducing monotony & supporting peak readiness).
                </Typography>
                {(() => {
                  if (!plan?.timeline) return <Typography variant="caption">No timeline data.</Typography>;
                  const scoreMap = { High:3, Medium:2, Low:1, Recovery:0.5, Off:0, Match:3.5 };
                  const daily = plan.timeline.map((d, i) => ({
                    id: i+1,
                    day: `D${i+1}`,
                    date: d.date,
                    load_class: d.load_class || (d.isFixture? 'Match': 'Unknown'),
                    score: scoreMap[d.load_class || (d.isFixture? 'Match': 'Low')] ?? 1,
                    meso: d.mesocycle_phase,
                    md: d.md_label || ''
                  }));
                  return (
                    <Box sx={{ display:'flex', flexDirection:'column', gap:3 }}>
                      <Box sx={{ width:'100%', overflowX:'auto' }}>
                        <BarChart
                          dataset={daily}
                          xAxis={[{ scaleType:'band', dataKey:'day', label:'Day', tickLabelStyle:{ fontSize:10 } }]}
                          yAxis={[{ label:'Load Score', tickLabelStyle:{ fontSize:10 } }]}
                          height={180}
                          series={[{ dataKey:'score', label:'Daily Load', color:'#1976d2' }]}
                          tooltip={{ trigger:'item', formatter:(item)=> {
                            const row = item?.data || {};
                            return `${row.date}\n${row.load_class}${row.md? ' ('+row.md+')':''}${row.meso? ' • '+row.meso:''} -> ${row.score}`;
                          }}}
                        />
                      </Box>
                      <Box>
                        {plan.weekly_metrics && plan.weekly_metrics.length>0 ? (
                          <LineChart
                            height={220}
                            xAxis={[{ data: plan.weekly_metrics.map(w=> w.week_index+1), label:'Week', tickLabelStyle:{ fontSize:10 } }]}
                            yAxis={[
                              { id:'load', label:'Weekly Load', tickLabelStyle:{ fontSize:10 } },
                              { id:'strain', label:'Strain', position:'right', tickLabelStyle:{ fontSize:10 } }
                            ]}
                            series={[
                              { id:'total_load', label:'Total Load', data: plan.weekly_metrics.map(w=> Number(w.total_load.toFixed(1))), color:'#0288d1', yAxisKey:'load', area:true },
                              { id:'strain', label:'Strain', data: plan.weekly_metrics.map(w=> w.strain), color:'#ef6c00', yAxisKey:'strain' }
                            ]}
                            slotProps={{ legend:{ direction:'horizontal', position:{ vertical:'top', horizontal:'start' }, padding:0 } }}
                            tooltip={{ trigger:'item', formatter:(item)=> {
                              const idx = item.dataIndex;
                              const w = plan.weekly_metrics[idx];
                              return `Week ${w.week_index+1} (${w.flag_monotony} monotony)\nTotal Load: ${w.total_load.toFixed(1)}\nMean: ${w.mean.toFixed(2)} SD: ${w.sd.toFixed(2)}\nMonotony: ${w.monotony} • Strain: ${w.strain}`;
                            }}}
                          />
                        ) : (
                          <Typography variant="caption">Weekly metrics not available.</Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
              <Box sx={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                <Box>
                  <Typography variant="overline" sx={{ fontSize:10 }}>SESSIONS</Typography>
                  <Typography variant="h6" sx={{ m:0 }}>{analytics.sessions}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ fontSize:10 }}>DRILLS</Typography>
                  <Typography variant="h6" sx={{ m:0 }}>{analytics.drills}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ fontSize:10 }}>UNIQUE</Typography>
                  <Typography variant="h6" sx={{ m:0 }}>{analytics.uniqueDrills}</Typography>
                  <Chip size="small" color={analytics.uniquenessLabel==='Excellent'?'success': analytics.uniquenessLabel==='Good'?'primary': analytics.uniquenessLabel==='Moderate'?'warning':'default'} label={`${analytics.uniquenessPct}% • ${analytics.uniquenessLabel}`} sx={{ mt:0.5 }} />
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ fontSize:10 }}>DURATION (MIN)</Typography>
                  <Typography variant="h6" sx={{ m:0 }}>{analytics.totalDurationMinutes}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ fontSize:10 }}>PHASE BALANCE</Typography>
                  <Typography variant="h6" sx={{ m:0 }}>{analytics.phaseEvenness}</Typography>
                  <Chip size="small" label={analytics.phaseEvennessLabel} color={analytics.phaseEvennessLabel==='Balanced'?'success': analytics.phaseEvennessLabel==='Slight Skew'?'warning':'default'} sx={{ mt:0.5 }} />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Load Distribution</Typography>
                <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                  {Object.entries(analytics.loadDistributionPct).map(([k,pct])=> (
                    <Chip key={k} label={`${k} ${pct}%`} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Phase Type Frequency</Typography>
                <Box sx={{ display:'flex', flexDirection:'column', gap:0.75 }}>
                  {Object.entries(analytics.phaseTypeFreq).map(([k,v])=> {
                    const max = Math.max(1,...Object.values(analytics.phaseTypeFreq));
                    const widthPct = (v/max)*100;
                    return (
                      <Box key={k} sx={{ display:'flex', alignItems:'center', gap:1 }}>
                        <Typography variant="caption" sx={{ width:70 }}>{k}</Typography>
                        <Box sx={{ flex:1, background:'var(--color-background-alt,#1e1e1e)', height:6, borderRadius:3, overflow:'hidden' }}>
                          <Box sx={{ width: `${widthPct}%`, height:'100%', background: v? 'linear-gradient(90deg,var(--color-primary,#1976d2), var(--color-accent,#42a5f5))':'transparent' }} />
                        </Box>
                        <Typography variant="caption" sx={{ width:24, textAlign:'right' }}>{v}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Session Intensity Labels</Typography>
                <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                  {Object.entries(analytics.intensitySessionCounts).map(([k,v])=> (
                    <Chip key={k} label={`${k}: ${v}`} size="small" />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Focus Principle Coverage</Typography>
                <Box sx={{ display:'flex', flexDirection:'column', gap:0.5 }}>
                  {analytics.principleCoverage.map(p => {
                    const barW = p.pct; const color = p.count>0 ? 'var(--color-success,#2e7d32)' : 'var(--color-warning,#ed6c02)';
                    return (
                      <Box key={p.name} sx={{ display:'flex', alignItems:'center', gap:1 }}>
                        <Typography variant="caption" sx={{ width:120, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
                        <Box sx={{ flex:1, height:6, background:'var(--color-background-alt,#1e1e1e)', borderRadius:3, overflow:'hidden' }}>
                          <Box sx={{ width:`${barW}%`, background: color, height:'100%' }} />
                        </Box>
                        <Typography variant="caption" sx={{ width:36, textAlign:'right' }}>{p.count}</Typography>
                      </Box>
                    );
                  })}
                  {analytics.uncoveredPrinciples.length === 0 && (
                    <Typography variant="caption" color="success.main">All focus principles covered ✔</Typography>
                  )}
                  {analytics.uncoveredPrinciples.length > 0 && (
                    <Typography variant="caption" color="warning.main">Uncovered: {analytics.uncoveredPrinciples.join(', ')}</Typography>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Top Repeated Drills</Typography>
                {analytics.topRepeats.length === 0 && <Typography variant="caption">No repetition yet.</Typography>}
                <Box sx={{ display:'flex', flexDirection:'column', gap:0.25 }}>
                  {analytics.topRepeats.map(r => (
                    <Box key={r.name} sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Typography variant="caption" sx={{ flex:1 }}>{r.name}</Typography>
                      <Chip size="small" label={r.count} />
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenReport(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openSettings} onClose={()=> setOpenSettings(false)} fullWidth maxWidth="sm">
        <DialogTitle>Plan Settings</DialogTitle>
        <DialogContent dividers sx={{ display:'flex', flexDirection:'column', gap:3 }}>
          {plan && (
            <Alert severity="info" variant="outlined" sx={{ fontSize:'12px' }}>
              These settings were applied to the current plan. Changes now will only affect the next generation. Regenerate to apply new values.
            </Alert>
          )}
          <Box>
            <Typography variant="subtitle2" gutterBottom>Variability (Model Flexibility)</Typography>
            <Box sx={{ display:'flex', gap:1 }}>
              {['low','medium','high'].map(level => {
                const active = settings.variability===level;
                return (
                  <Chip key={level} clickable={!plan} disabled={!!plan} color={active? 'primary':'default'} label={level} onClick={()=> !plan && saveSettings({ ...settings, variability: level })} size="small" />
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt:1, display:'block' }}>
              Controls how adventurous drill selection is (affects sampling temperature & diversity penalties).
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Plan Objective</Typography>
            <TextField
              placeholder="e.g. Improve high press & rapid transition to attack"
              value={settings.objective}
              onChange={(e)=> !plan && saveSettings({ ...settings, objective: e.target.value })}
              fullWidth
              multiline
              minRows={2}
              disabled={!!plan}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt:1, display:'block' }}>
              Incorporated into AI summary & rationale generation.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Drill Generation Mode</Typography>
            <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
              {[
                { key:'curated', label:'Curated', tip:'Only use vetted drills library (stable, repeatable).'},
                { key:'hybrid', label:'Hybrid', tip:'Mix vetted drills with some AI-created drills (balanced).'},
                { key:'generative', label:'Generative', tip:'Allow full AI creation of drills (novel, may need review).'}
              ].map(opt => {
                const active = settings.generationMode === opt.key;
                return (
                  <Tooltip key={opt.key} title={opt.tip} arrow>
                    <span>
                      <Chip
                        clickable={!plan}
                        disabled={!!plan}
                        color={active? 'primary':'default'}
                        label={opt.label}
                        onClick={()=> !plan && saveSettings({ ...settings, generationMode: opt.key })}
                        size="small"
                        variant={active? 'filled':'outlined'}
                      />
                    </span>
                  </Tooltip>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt:1, display:'block' }}>
              Curated = safest. Hybrid = some novelty. Generative = maximum creativity (JSON-validated, may produce imperfect drills; edit as needed).
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Focus Principles (max 7)</Typography>
            <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
              {['attacking','defending','transition'].map(section => {
                const list = principlesData.principles_of_play[section] || [];
                return (
                  <Box key={section}>
                    <Typography variant="caption" sx={{ textTransform:'uppercase', fontWeight:600, letterSpacing:0.5 }}>{section}</Typography>
                    <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.5, mt:0.5 }}>
                      {list.map(p => {
                        const active = settings.selectedPrinciples.includes(p.name);
                        const disabled = (!!plan) || (!active && settings.selectedPrinciples.length >= 7);
                        return (
                          <Chip
                            key={p.name}
                            label={p.name}
                            size="small"
                            color={active? 'primary':'default'}
                            variant={active? 'filled':'outlined'}
                            onClick={()=> {
                              if (plan) return; // locked after generation
                              if (active) {
                                saveSettings({ ...settings, selectedPrinciples: settings.selectedPrinciples.filter(n => n !== p.name) });
                              } else if (!disabled) {
                                saveSettings({ ...settings, selectedPrinciples: [...settings.selectedPrinciples, p.name] });
                              }
                            }}
                            disabled={disabled}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt:1, display:'block' }}>
              Overrides auto-selected subset when generating a new plan.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setOpenSettings(false)}>Close</Button>
          <Button variant="contained" onClick={()=> { setOpenSettings(false); }}>Done</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Load Edit Menu */}
      <Menu
        anchorEl={loadEditAnchor}
        open={Boolean(loadEditAnchor)}
        onClose={()=> { setLoadEditAnchor(null); setLoadEditDayIndex(null); }}
        MenuListProps={{ dense:true }}
      >
        {['High','Medium','Low','Recovery','Off'].map(lc => (
          <MenuItem key={lc} onClick={()=> {
            if (plan && loadEditDayIndex!=null) {
              updateDayLoad(plan, loadEditDayIndex, lc, { invalidateDrills: true });
              setPlan({ ...plan, timeline:[...plan.timeline], sessions:[...plan.sessions] });
              setSnackbar({ open:true, message:`Day ${loadEditDayIndex+1} set to ${lc}`, severity:'info'});
            }
            setLoadEditAnchor(null); setLoadEditDayIndex(null);
          }}>{lc}</MenuItem>
        ))}
      </Menu>

      {/* Drill Edit Modal */}
      <DrillEditModal
        open={drillEditModalOpen}
        onClose={handleCloseDrillEditModal}
        drill={editingDrillData}
        onSave={handleSaveDrill}
        sessionIndex={editingDrillContext?.sessionIndex}
        phaseIndex={editingDrillContext?.phaseIndex}
        drillIndex={editingDrillContext?.drillIndex}
      />
    </Box>
  );
}

export default TeamPeriodization;
