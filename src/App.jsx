import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary';
import LayoutWithMainNav from './components/LayoutWithMainNav'
import SimplePage from './pages/SimplePage'
import Athletes from './pages/Athletes'
import TeamPeriodization from './pages/TeamPeriodization';
import PlanManagement from './pages/PlanManagement';
import WorkloadPage from './pages/WorkloadPage';
import { useState, useEffect } from 'react';
import { AthleteDataGrid } from './components';

function App() {
  const [headerControls, setHeaderControls] = useState(null);
  const location = useLocation();

  // Clear header controls when navigating away from team-planning
  useEffect(() => {
    if (location.pathname !== '/team-planning') {
      setHeaderControls(null);
    }
  }, [location.pathname]);

  return (
    <LayoutWithMainNav headerControls={headerControls}>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/plan-management" replace />} />
        <Route path="/dashboard" element={<SimplePage pageName="Dashboard" />} />
        <Route path="/medical" element={<SimplePage pageName="Medical" />} />
        <Route path="/analysis" element={<SimplePage pageName="Analysis" />} />
        <Route path="/athlete" element={<Athletes />} />
        <Route path="/workloads" element={<WorkloadPage />} />
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
    </LayoutWithMainNav>
  )
}

export default App