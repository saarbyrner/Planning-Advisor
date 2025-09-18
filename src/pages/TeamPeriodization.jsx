import { useState } from 'react';
import { Box, Button, Card, Typography, Tab, Tabs, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart'; // Fallback to BarChart if Gantt requires Pro
import { generateTeamPlan } from '../utils/generatePlan';

function TeamPeriodization() {
  const [plan, setPlan] = useState(null);
  const [selectedSession, setSelectedSession] = useState(0); // Index of selected session
  const [loading, setLoading] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState(5); // Default to 5 weeks

  const handleGenerate = async (teamId) => {
    setLoading(true);
    const generatedPlan = await generateTeamPlan(teamId, selectedWeeks);
    setPlan(generatedPlan);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Planning Advisor</Typography>
      <FormControl sx={{ minWidth: 120, mr: 2 }}>
        <InputLabel>Weeks</InputLabel>
        <Select
          value={selectedWeeks}
          onChange={(e) => setSelectedWeeks(e.target.value)}
          label="Weeks"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
            <MenuItem key={w} value={w}>{w} weeks</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button onClick={() => handleGenerate(1)}>Generate for First Team</Button> {/* Example; add squad selector */}
      {loading && <Typography>Loading...</Typography>}
      {plan && (
        <>
          {typeof plan === 'object' && plan.timeline && plan.sessions ? (
            <>
              <Typography variant="h5" sx={{ mt: 2 }}>5 Week Block</Typography>
              <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}> {/* Scrollable container */}
                <Tabs
                  value={selectedSession}
                  onChange={(event, newValue) => setSelectedSession(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="Day selector"
                >
                  {plan.timeline.map((day, index) => (
                    <Tab
                      key={index}
                      label={`Day ${day.day}: ${day.label}`}
                      sx={{ backgroundColor: day.color, color: 'white !important', minWidth: 120 }}
                      value={index}
                    />
                  ))}
                </Tabs>
              </Box>
              {plan.sessions.length > 0 && plan.sessions[selectedSession] ? ( // Added check for defined session
                <Card sx={{ mt: 2, p: 2 }}>
                  <Typography variant="h6">Training Session Name</Typography>
                  <Typography>{plan.sessions[selectedSession].name}</Typography>
                  <Typography>
                    Date: {plan.sessions[selectedSession].date} | Overall Load: {plan.sessions[selectedSession].overall_load} | Principles: {plan.sessions[selectedSession].principles} | Play Athletes: {plan.sessions[selectedSession].play_athletes}
                  </Typography>
                  <ul>
                    {/* Bullet list placeholder if needed */}
                  </ul>
                  {plan.sessions[selectedSession].drills.map((drill, dIdx) => (
                    <Box key={dIdx} sx={{ mt: 1, border: '1px solid grey', p: 1 }}>
                      <Typography>Drill Name: {drill.name}</Typography>
                      <Typography>Duration: {drill.duration} min</Typography>
                      <Typography>Load: {drill.load}</Typography>
                      <Typography>Staff: {drill.staff}</Typography>
                    </Box>
                  ))}
                </Card>
              ) : (
                <Typography>No session available for this day. It might be a rest or recovery day.</Typography> // Fallback message
              )}
            </>
          ) : (
            <Typography color="error">Error generating plan: {typeof plan === 'string' ? plan : 'Invalid plan format'}</Typography>
          )}
        </>
      )}
    </Box>
  );
}

export default TeamPeriodization;
