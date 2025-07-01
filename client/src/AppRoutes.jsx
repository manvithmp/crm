import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import EmpLead from './pages/EmpLead';
import SignIn from './pages/SignIn';
import Employees from './pages/Employees';
import AdminSettings from './pages/AdminSettings';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmpSchedule from './pages/EmpSchedule';
import Profile from './pages/Profile';

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes({ user, setUser, handleLogout }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? user.role === "employee"
              ? <Navigate to="/employee_dashboard" replace />
              : <Navigate to="/dashboard" replace />
            : <SignIn onSignIn={setUser} />
        }
      />
      <Route
        path="/employee_dashboard"
        element={
          <ProtectedRoute user={user}>
            {user?.role === 'employee'
              ? <EmployeeDashboard user={user} handleLogout={handleLogout} />
              : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee_leads"
        element={
          <ProtectedRoute user={user}>
            {user?.role === 'employee'
              ? <EmpLead user={user} />
              : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee_schedule"
        element={
          <ProtectedRoute user={user}>
            {user?.role === 'employee'
              ? <EmpSchedule user={user} />
              : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user}>
            <Profile user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute user={user}>
            <Leads user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute user={user}>
            <Employees user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute user={user}>
            <AdminSettings user={user} />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          user
            ? user.role === "employee"
              ? <Navigate to="/employee_dashboard" replace />
              : <Navigate to="/dashboard" replace />
            : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

export default AppRoutes;
