import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, companySettings, logoSrc, notifications } = useAuth();
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const adminLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Agents', path: '/agents', icon: Users },
    { name: 'Customers', path: '/customers', icon: UserCheck },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadNotifications
    },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const agentLinks = [
    { name: 'Dashboard', path: '/agent-dashboard', icon: LayoutDashboard },
    { name: 'My Customers', path: '/agent-customers', icon: UserCheck },
    {
      name: 'Notifications',
      path: '/agent-notifications',
      icon: Bell,
      badge: unreadNotifications
    },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : agentLinks;

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-deepBlue-900 text-slate-200 border-r border-deepBlue-850 shadow-2xl">
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-6 border-b border-deepBlue-800/60 bg-deepBlue-950/20">
          <div className="flex items-center gap-2">
            {logoSrc ? (
              <img src={logoSrc} alt="Srimaan Solar Logo" className="h-9 w-auto object-contain rounded-lg" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-solarOrange to-amber-500 text-white font-bold text-lg shadow-md shadow-solarOrange/30">
                S
              </div>
            )}
            <span className="font-display font-bold text-lg tracking-wide text-white truncate max-w-[160px]">
              {companySettings.companyName}
            </span>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:bg-deepBlue-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-5 border-b border-deepBlue-800/40">
          <div className="flex items-center gap-3 bg-deepBlue-800/30 rounded-2xl p-3 border border-deepBlue-800/25">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-solarOrange/10 border border-solarOrange/30 text-solarOrange font-display font-semibold">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-white truncate">{user?.fullName}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-solarOrange text-white shadow-lg shadow-solarOrange/20'
                      : 'text-slate-400 hover:bg-deepBlue-800/50 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0 group-hover:scale-105 transition-transform" />
                  <span>{link.name}</span>
                </div>
                {link.badge > 0 && (
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    window.location.pathname === link.path
                      ? 'bg-white text-solarOrange'
                      : 'bg-solarOrange text-white'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-deepBlue-800/40 bg-deepBlue-950/10">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-400 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
