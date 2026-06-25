import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-deepBlue-950">
        <div className="relative flex flex-col items-center">
          {/* Glowing loader */}
          <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-solarOrange animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-solarOrange/10 animate-pulse-glow"></div>
          <p className="mt-4 font-display font-medium text-slate-500 dark:text-slate-400">Loading Srimaan Solar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If agent tries to access admin, send to agent dashboard
    if (user.role === 'AGENT') {
      return <Navigate to="/agent-dashboard" replace />;
    }
    // If admin tries to access agent, send to admin dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
