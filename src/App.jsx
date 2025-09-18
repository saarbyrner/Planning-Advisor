import { Routes, Route, useLocation } from 'react-router-dom'
import LayoutWithMainNav from './components/LayoutWithMainNav'
import SimplePage from './pages/SimplePage'
import Athletes from './pages/Athletes'
import TeamPeriodization from './pages/TeamPeriodization';
import { useState, useEffect } from 'react';
import { AthleteDataGrid, Button, Card } from './components';
import { getAthletes, getFixtures, getPerformance, savePlan } from './utils/supabase';
import { generatePlan } from './utils/generatePlan';

function App() {
  const [athletes, setAthletes] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const location = useLocation();

  useEffect(() => {
    async function fetchData() {
      const data = await getAthletes();
      setAthletes(data);
    }
    fetchData();
  }, []);

  const handleGenerate = async (athlete) => {
    const fixtures = await getFixtures(athlete.id);
    const performance = await getPerformance(athlete.id);
    const plan = await generatePlan(athlete, athlete.profile, fixtures, performance[0]?.metrics || {});
    setSelectedPlan(plan);
    await savePlan(athlete.id, plan);
  };

  return (
    <LayoutWithMainNav>
      <Routes>
        <Route path="/" element={<SimplePage pageName="Home" />} />
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
        <Route path="/team-planning" element={<TeamPeriodization />} />
      </Routes>
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