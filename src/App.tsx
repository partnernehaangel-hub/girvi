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
import CustomerPanel from './components/CustomerPanel';

export default function App() {
  const [auth, setAuth] = React.useState<{ role: 'admin' | 'customer' | null, user: any }>(() => {
    try {
      const saved = localStorage.getItem('girvi_auth');
      return saved ? JSON.parse(saved) : { role: null, user: null };
    } catch (e) {
      console.error('Failed to parse auth from localStorage', e);
      return { role: null, user: null };
    }
  });

  const handleLogin = async (id: string, pass: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password: pass })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuth(data);
        localStorage.setItem('girvi_auth', JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = () => {
    setAuth({ role: null, user: null });
    localStorage.removeItem('girvi_auth');
  };

  if (!auth.role) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (auth.role === 'customer') {
    return (
      <Router>
        <CustomerPanel user={auth.user} onLogout={handleLogout} />
      </Router>
    );
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
