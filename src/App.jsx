import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary';
import LayoutWithMainNav from './components/LayoutWithMainNav'
import SimplePage from './pages/SimplePage'
import Athletes from './pages/Athletes'
import TeamPeriodization from './pages/TeamPeriodization';
import PlanManagement from './pages/PlanManagement';
import { useState, useEffect, useRef } from 'react';
import { AthleteDataGrid, Button, Card } from './components';
import { getAthletes, getFixtures, getPerformance, savePlan } from './utils/supabase';
import { generatePlan } from './utils/generatePlan';

function App() {
  const [athletes, setAthletes] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [headerControls, setHeaderControls] = useState(null);
  const location = useLocation();

  useEffect(() => {
    async function fetchData() {
      const data = await getAthletes();
      setAthletes(data);
    }
    fetchData();
  }, []);

  // Clear header controls when navigating away from team-planning
  useEffect(() => {
    if (location.pathname !== '/team-planning') {
      setHeaderControls(null);
    }
  }, [location.pathname]);

  const handleGenerate = async (athlete) => {
    const fixtures = await getFixtures(athlete.id);
    const performance = await getPerformance(athlete.id);
    const plan = await generatePlan(athlete, athlete.profile, fixtures, performance[0]?.metrics || {});
    setSelectedPlan(plan);
    await savePlan(athlete.id, plan);
  };

  return (
    <LayoutWithMainNav headerControls={headerControls}>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/plan-management" replace />} />
        <Route path="/dashboard" element={<SimplePage pageName="Dashboard" />} />
        <Route path="/medical" element={<SimplePage pageName="Medical" />} />
        <Route path="/analysis" element={<SimplePage pageName="Analysis" />} />
        <Route path="/athlete" element={<Athletes />} />
        <Route path="/workloads" element={<SimplePage pageName="Workload" />} />
        <Route path="/questionnaires" element={<SimplePage pageName="Forms" />} />
        <Route path="/planning" element={<SimplePage pageName="Calendar" />} />
        <Route path="/activity" element={<SimplePage pageName="Activity log" />} />
        <Route path="/settings" element={<SimplePage pageName="Admin" />} />
        <Route path="/help" element={<SimplePage pageName="Help" />} />
        <Route path="/team-planning" element={<TeamPeriodization onHeaderControlsChange={setHeaderControls} />} />
        <Route path="/plan-management" element={<PlanManagement />} />
  </Routes>
  </ErrorBoundary>
      {/* Temporarily comment out AthleteDataGrid to avoid MUI license warnings */}
      {/* {location.pathname !== '/team-planning' && <AthleteDataGrid athletes={athletes} />} */}
      {location.pathname === '/workloads' && (
        <>
          {athletes.map(athlete => (
            <Button key={athlete.id} onClick={() => handleGenerate(athlete)}>Generate Plan for {athlete.name}</Button>
          ))}
          {selectedPlan && <Card>{selectedPlan}</Card>}
        </>
      )}
    </LayoutWithMainNav>
  )
}

export default App