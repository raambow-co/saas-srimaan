import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ProtectedRoute from './components/Shared/ProtectedRoute.jsx';
import DashboardLayout from './components/Shared/DashboardLayout.jsx';
import Login from './components/Auth/Login.jsx';
import AdminDashboard from './components/Dashboard/AdminDashboard.jsx';
import AgentDashboard from './components/Dashboard/AgentDashboard.jsx';
import AgentList from './components/Agents/AgentList.jsx';
import CustomerList from './components/Customers/CustomerList.jsx';
import ReportsPanel from './components/Reports/ReportsPanel.jsx';
import SettingsPanel from './components/Settings/SettingsPanel.jsx';
import NotificationsPage from './components/Notifications/NotificationsPage.jsx';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* ADMIN Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="agents" element={<AgentList />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="reports" element={<ReportsPanel />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPanel />} />
            </Route>

            {/* AGENT Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['AGENT']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="agent-dashboard" element={<AgentDashboard />} />
              <Route path="agent-customers" element={<CustomerList />} />
              <Route path="agent-notifications" element={<NotificationsPage />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
