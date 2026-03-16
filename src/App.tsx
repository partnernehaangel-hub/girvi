import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import LoanManagement from './components/LoanManagement';
import InterestEngine from './components/InterestEngine';
import PaymentManagement from './components/PaymentManagement';
import LockerManagement from './components/LockerManagement';
import Reports from './components/Reports';
import LegalDocs from './components/LegalDocs';
import GirviItems from './components/GirviItems';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return localStorage.getItem('isAdminAuthenticated') === 'true';
  });

  const handleLogin = (id: string, pass: string) => {
    if (id === 'admin' && pass === '12345') {
      setIsAuthenticated(true);
      localStorage.setItem('isAdminAuthenticated', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAdminAuthenticated');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-bg-light">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/items" element={<GirviItems />} />
            <Route path="/loans" element={<LoanManagement />} />
            <Route path="/interest" element={<InterestEngine />} />
            <Route path="/payments" element={<PaymentManagement />} />
            <Route path="/locker" element={<LockerManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/docs" element={<LegalDocs />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            {/* Add other routes as needed */}
            <Route path="*" element={<div className="p-8 text-center text-gray-500">Module coming soon...</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
