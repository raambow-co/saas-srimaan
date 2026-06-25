import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, Menu, X, Check, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const Navbar = ({ onMenuClick }) => {
  const {
    user,
    logout,
    notifications,
    companySettings,
    logoSrc,
    markNotificationRead,
    markAllNotificationsRead
  } = useAuth();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [animateBell, setAnimateBell] = useState(false);

  const notifyDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimateBell(true);
      const timer = setTimeout(() => setAnimateBell(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/60 dark:border-deepBlue-800/60 bg-white/80 dark:bg-deepBlue-900/80 backdrop-blur-md px-6 shadow-sm">
      {/* Left side: Brand Logo for Mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-deepBlue-800"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          {logoSrc ? (
            <img src={logoSrc} alt="Srimaan Solar Logo" className="h-8 w-auto object-contain rounded-lg" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-solarOrange to-amber-500 text-white font-bold text-lg shadow-md shadow-solarOrange/20">
              S
            </div>
          )}
          <span className="font-display font-bold text-lg text-slate-800 dark:text-white truncate max-w-[150px]">
            {companySettings.companyName}
          </span>
        </div>
        
        {/* Breadcrumb / Greetings on Desktop */}
        <div className="hidden lg:block">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Welcome back,
          </h2>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {user?.fullName}
          </p>
        </div>
      </div>

      {/* Right side: Options */}
      <div className="flex items-center gap-4">
        <ThemeToggle />

        {/* Notifications Panel */}
        <div className="relative" ref={notifyDropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl border border-slate-200/60 dark:border-deepBlue-700/60 bg-white/50 dark:bg-deepBlue-800/40 text-slate-600 dark:text-slate-300 hover:text-solarOrange dark:hover:text-solarOrange hover:bg-slate-100 dark:hover:bg-deepBlue-800/80 transition-all duration-300 shadow-sm relative ${
              animateBell ? 'animate-bounce' : ''
            }`}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-deepBlue-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 lg:w-96 rounded-2xl border border-slate-200/60 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 p-2 shadow-2xl animate-fade-in z-50">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-deepBlue-800 px-4 py-3">
                <span className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="flex items-center gap-1 text-xs font-medium text-solarOrange hover:text-solarOrange-hover transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto py-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                    <ShieldAlert className="h-8 w-8 stroke-1 mb-2" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((note) => (
                    <div
                      key={note._id || note.id}
                      onClick={() => markNotificationRead(note._id || note.id)}
                      className={`flex flex-col gap-1 rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                        note.read
                          ? 'hover:bg-slate-50 dark:hover:bg-deepBlue-800/40 text-slate-600 dark:text-slate-400'
                          : 'bg-solarOrange/5 dark:bg-solarOrange/5 hover:bg-solarOrange/10 dark:hover:bg-solarOrange/10 text-slate-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-solarOrange">
                          {note.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-2">{note.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 p-1 rounded-full border border-slate-200/60 dark:border-deepBlue-700/60 hover:bg-slate-100 dark:hover:bg-deepBlue-800/40 transition-colors duration-300"
          >
            {/* Avatar image / Initial */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-solarOrange to-amber-500 font-display font-semibold text-white text-sm shadow-inner shadow-black/10">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            
            <div className="hidden md:flex flex-col items-start pr-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
                {user?.fullName}
              </span>
              <span className="text-[10px] font-medium text-slate-400 capitalize">
                {user?.role?.toLowerCase()}
              </span>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200/60 dark:border-deepBlue-800 bg-white dark:bg-deepBlue-900 p-2 shadow-2xl animate-fade-in z-50">
              <div className="border-b border-slate-100 dark:border-deepBlue-800 px-3 py-2 text-center md:hidden">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
