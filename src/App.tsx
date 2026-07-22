import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetail } from './pages/ProjectDetail';
import { Invitations } from './pages/Invitations';
import { Payments } from './pages/Payments';
import { Disputes } from './pages/Disputes';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/disputes" element={<Disputes />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
