import React, { useState } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import Sidebar from './components/Sidebar';

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? { token } : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  function LayoutWrapper() {
    const location = useLocation();
    const employeePaths = [
      '/employee_dashboard',
      '/employee_leads',
      '/employee_schedule',
      '/profile'
    ];
    const hideSidebar = employeePaths.some((path) => location.pathname.startsWith(path));

    return (
      <>
        {!hideSidebar && user && <Sidebar onLogout={handleLogout} />}
        <AppRoutes user={user} setUser={setUser} handleLogout={handleLogout} />
      </>
    );
  }

  return (
    <Router>
      <LayoutWrapper />
    </Router>
  );
}

export default App;
