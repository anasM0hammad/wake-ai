import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, Onboarding, AlarmRingingPage, Settings, Dashboard } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/alarm-ringing" element={<AlarmRingingPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
