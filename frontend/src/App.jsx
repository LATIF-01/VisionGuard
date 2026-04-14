import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import LLMQuery from './pages/LLMQuery';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page - no sidebar layout */}
        <Route path="/" element={<Landing />} />
        
        {/* Main app pages - with sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/query" element={<LLMQuery />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
