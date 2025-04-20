import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SahaayaAIBot from './pages/SahaayaAI';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute/index.jsx';

import 'leaflet/dist/leaflet.css';
import LicensePlateChecker from './pages/LicensePlateChecker/index.jsx';
import SafeRouteNavigation from './pages/SafeRouteNavigation/index.jsx';
import CallMeButton from './pages/TTEST/index.jsx';
import FakePhoneCall from './pages/FakePhoneCall/index.jsx';
import CrimeHeatMap from './pages/CrimeHeatMap/index.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sahaaya" element={<SahaayaAIBot />} />
          <Route path="/licenseplatechecker" element={<LicensePlateChecker />} />
          <Route path="/saferoutenavigation" element={<SafeRouteNavigation />} />
          <Route path="/crimeheatmap" element={<CrimeHeatMap />} />
          <Route path="/fakephonecall" element={<FakePhoneCall />} />
          <Route path="/tester" element={<CallMeButton />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;