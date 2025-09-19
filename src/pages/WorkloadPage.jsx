import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  PersonOutlined,
  AssessmentOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  RefreshOutlined,
  DownloadOutlined,
  ShareOutlined,
  ExpandMoreOutlined,
  FitnessCenterOutlined,
  ScheduleOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@mui/icons-material';
import { PlayerAvatar } from '../components';
import { getAthletes, getFixtures, getPerformance, savePlan } from '../utils/supabase';
import { generatePlan } from '../utils/generatePlan';
import '../styles/design-tokens.css';

function WorkloadPage() {
  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedReports, setSavedReports] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAthletes();
        setAthletes(data);
      } catch (err) {
        setError('Failed to load athletes');
      }
    }
    fetchData();
  }, []);

  const handleGenerateReport = async (athlete) => {
    setLoading(true);
    setError(null);
    setSelectedAthlete(athlete);
    
    try {
      const fixtures = await getFixtures(athlete.id);
      const performance = await getPerformance(athlete.id);
      const report = await generatePlan(athlete, athlete.profile, fixtures, performance[0]?.metrics || {});
      
      setGeneratedReport(report);
      await savePlan(athlete.id, report);
      setSavedReports(prev => ({ ...prev, [athlete.id]: true }));
    } catch (err) {
      setError('Failed to generate report');
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseReportContent = (reportText) => {
    if (!reportText) return { sections: [] };
    
    // Parse the AI-generated report into structured sections
    const lines = reportText.split('\n').filter(line => line.trim());
    const sections = [];
    let currentSection = null;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Detect section headers (lines that end with colon or are all caps)
      if (trimmed.endsWith(':') || (trimmed.length > 3 && trimmed === trimmed.toUpperCase() && !trimmed.includes(' '))) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmed.replace(':', ''),
          content: []
        };
      } else if (currentSection && trimmed) {
        currentSection.content.push(trimmed);
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If no sections were found, create a default section
    if (sections.length === 0) {
      sections.push({
        title: 'Training plan',
        content: lines
      });
    }
    
    return { sections };
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'average': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getLoadColor = (load) => {
    switch (load?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const renderAthleteCard = (athlete) => (
    <Card 
      key={athlete.id}
      sx={{ 
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 'var(--shadow-lg)',
          transform: 'translateY(-2px)'
        },
        border: selectedAthlete?.id === athlete.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border-primary)'
      }}
      onClick={() => setSelectedAthlete(athlete)}
    >
      <CardContent sx={{ p: 'var(--spacing-md)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <PlayerAvatar 
            playerId={athlete.id} 
            playerName={athlete.name} 
            size="large"
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ 
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-semibold)',
              mb: 'var(--spacing-xs)'
            }}>
              {athlete.name}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'var(--color-text-secondary)',
              mb: 'var(--spacing-sm)'
            }}>
              {athlete.position} • {athlete.team}
            </Typography>
            <Box sx={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
              <Chip 
                label={athlete.status || 'Active'} 
                size="small" 
                color={getStatusColor(athlete.status)}
                variant="outlined"
              />
              {athlete.injury_status && (
                <Chip 
                  label={athlete.injury_status} 
                  size="small" 
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <Button
              variant="contained"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateReport(athlete);
              }}
              disabled={loading}
              sx={{
                backgroundColor: 'var(--button-primary-bg)',
                color: 'var(--button-primary-color)',
                '&:hover': { backgroundColor: 'var(--button-primary-hover-bg)' },
                minWidth: '120px'
              }}
            >
              {loading && selectedAthlete?.id === athlete.id ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                'Generate report'
              )}
            </Button>
            {savedReports[athlete.id] && (
              <Chip 
                icon={<CheckCircleOutlined />}
                label="Saved" 
                size="small" 
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const getSectionIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('training') || lowerTitle.includes('workout')) return <FitnessCenterOutlined />;
    if (lowerTitle.includes('schedule') || lowerTitle.includes('calendar')) return <ScheduleOutlined />;
    if (lowerTitle.includes('warning') || lowerTitle.includes('caution')) return <WarningOutlined />;
    if (lowerTitle.includes('assessment') || lowerTitle.includes('analysis')) return <AssessmentOutlined />;
    if (lowerTitle.includes('performance') || lowerTitle.includes('metrics')) return <TrendingUpOutlined />;
    return <AssessmentOutlined />;
  };

  const renderReportSection = (section, index) => (
    <Accordion key={index} sx={{ mb: 1, border: '1px solid var(--color-border-primary)' }}>
      <AccordionSummary
        expandIcon={<ExpandMoreOutlined />}
        sx={{
          backgroundColor: 'var(--color-background-secondary)',
          '&:hover': { backgroundColor: 'var(--color-background-tertiary)' },
          '&.Mui-expanded': {
            backgroundColor: 'var(--color-background-tertiary)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {getSectionIcon(section.title)}
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)'
          }}>
            {section.title}
          </Typography>
          <Chip 
            label={`${section.content.length} items`} 
            size="small" 
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 'var(--spacing-md)' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {section.content.map((line, lineIndex) => (
            <Box key={lineIndex} sx={{ 
              p: 'var(--spacing-sm)',
              backgroundColor: 'var(--color-background-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-secondary)'
            }}>
              <Typography variant="body2" sx={{ 
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--line-height-relaxed)'
              }}>
                {line}
              </Typography>
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );

  const renderGeneratedReport = () => {
    if (!generatedReport || !selectedAthlete) return null;

    const { sections } = parseReportContent(generatedReport);

    return (
      <Card sx={{ mt: 'var(--spacing-lg)' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <PlayerAvatar 
                playerId={selectedAthlete.id} 
                playerName={selectedAthlete.name} 
                size="medium"
              />
              <Box>
                <Typography variant="h5" sx={{ 
                  color: 'var(--color-text-primary)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  AI workload report
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                  Generated for {selectedAthlete.name} • {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Tooltip title="Regenerate report">
                <IconButton 
                  onClick={() => handleGenerateReport(selectedAthlete)}
                  disabled={loading}
                >
                  <RefreshOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download report">
                <IconButton>
                  <DownloadOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share report">
                <IconButton>
                  <ShareOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {sections.length > 0 ? (
            <Box>
              {/* Report Summary */}
              <Box sx={{ 
                p: 'var(--spacing-md)', 
                backgroundColor: 'var(--color-background-secondary)',
                borderBottom: '1px solid var(--color-border-primary)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', mb: 'var(--spacing-sm)' }}>
                  <AssessmentOutlined sx={{ color: 'var(--color-primary)' }} />
                  <Typography variant="h6" sx={{ 
                    color: 'var(--color-text-primary)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    Report summary
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<AssessmentOutlined />}
                    label={`${sections.length} sections`} 
                    variant="outlined"
                    color="primary"
                  />
                  <Chip 
                    icon={<ScheduleOutlined />}
                    label={`${new Date().toLocaleDateString()}`} 
                    variant="outlined"
                  />
                  <Chip 
                    icon={<CheckCircleOutlined />}
                    label="AI Generated" 
                    variant="outlined"
                    color="success"
                  />
                </Box>
              </Box>
              
              {/* Report Sections */}
              <Box sx={{ p: 'var(--spacing-md)' }}>
                {sections.map((section, index) => renderReportSection(section, index))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 'var(--spacing-lg)' }}>
              <Paper sx={{ 
                p: 'var(--spacing-lg)', 
                backgroundColor: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border-primary)'
              }}>
                <Typography variant="body1" sx={{ 
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 'var(--line-height-relaxed)'
                }}>
                  {generatedReport}
                </Typography>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ py: 'var(--spacing-lg)', px: 'var(--spacing-lg)' }}>
      {/* Header */}
      <Box sx={{ mb: 'var(--spacing-xl)' }}>
        <Typography variant="h4" sx={{ 
          color: 'var(--color-text-primary)',
          fontWeight: 'var(--font-weight-bold)',
          mb: 'var(--spacing-sm)'
        }}>
          Workload management
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)' }}>
          Generate AI-powered workload reports for individual athletes
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 'var(--spacing-lg)' }}>
          {error}
        </Alert>
      )}

      {/* Loading Progress */}
      {loading && (
        <Box sx={{ mb: 'var(--spacing-lg)' }}>
          <LinearProgress sx={{ mb: 'var(--spacing-sm)' }} />
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            Generating AI report for {selectedAthlete?.name}...
          </Typography>
        </Box>
      )}

      {/* Athletes Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ 
            color: 'var(--color-text-primary)',
            fontWeight: 'var(--font-weight-semibold)',
            mb: 'var(--spacing-md)'
          }}>
            Select athlete
          </Typography>
          <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {athletes.map(renderAthleteCard)}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ 
            color: 'var(--color-text-primary)',
            fontWeight: 'var(--font-weight-semibold)',
            mb: 'var(--spacing-md)'
          }}>
            Generated reports
          </Typography>
          {selectedAthlete ? (
            <Box>
              {renderGeneratedReport()}
            </Box>
          ) : (
            <Paper sx={{ 
              p: 'var(--spacing-xl)', 
              textAlign: 'center',
              backgroundColor: 'var(--color-background-secondary)',
              border: '2px dashed var(--color-border-primary)'
            }}>
              <AssessmentOutlined sx={{ 
                fontSize: 48, 
                color: 'var(--color-text-muted)',
                mb: 'var(--spacing-md)'
              }} />
              <Typography variant="h6" sx={{ 
                color: 'var(--color-text-secondary)',
                mb: 'var(--spacing-sm)'
              }}>
                No athlete selected
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
                Select an athlete from the list to generate their workload report
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default WorkloadPage;
