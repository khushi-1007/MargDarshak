import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FleetProvider } from './context/FleetContext';
import { LanguageProvider } from './context/LanguageContext';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { Operations } from './pages/Operations';
import { Fleet } from './pages/Fleet';
import { Orders } from './pages/Orders';
import { Routes as RoutesPage } from './pages/Routes';
import { WhatIf } from './pages/WhatIf';
import { Analytics } from './pages/Analytics';
import { DriverConsole } from './pages/DriverConsole';
import { DriverDashboard } from './pages/DriverDashboard';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <FleetProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route index element={<Dashboard />} />
              <Route path="operations" element={<Operations />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="orders" element={<Orders />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="what-if" element={<WhatIf />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="driver-console" element={<DriverConsole />} />
            </Route>
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/manager" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </FleetProvider>
    </LanguageProvider>
  );
};

export default App;
