import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AgentLayout from './components/layout/AgentLayout';
import AgentConsole from './pages/AgentConsole';
import PostCallAnalysis from './pages/PostCallAnalysis';
import SupervisorDashboard from './pages/SupervisorDashboard';
import CoachingHub from './pages/CoachingHub';
import AgentDashboard from './pages/AgentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SOPManager from './pages/SOPManager';

// Mock missing pages for compilation
const MockPage = ({ title }) => (
  <div className="flex items-center justify-center h-full text-gray-500 text-2xl font-bold">
    {title} Coming Soon
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AgentLayout />}>
          <Route index element={<Navigate to="/console" replace />} />
          <Route path="console" element={<AgentConsole />} />
          <Route path="analysis" element={<PostCallAnalysis />} />
          <Route path="supervisor" element={<SupervisorDashboard />} />
          <Route path="coaching" element={<CoachingHub />} />
          <Route path="dashboard" element={<AgentDashboard />} />
          <Route path="manager" element={<ManagerDashboard />} />
          <Route path="sops" element={<SOPManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
