import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Lock, User, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const Login = () => {
  const { login, logoSrc, companySettings } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      // Local storage already has user role. Check user data and navigate
      const userStr = localStorage.getItem('srimaan_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') {
          navigate('/dashboard');
        } else {
          navigate('/agent-dashboard');
        }
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-deepBlue-950 px-4 transition-colors duration-300 overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-glow blur-3xl pointer-events-none"></div>

      {/* Floating Theme Toggler */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200/60 dark:border-deepBlue-800/60 bg-white/60 dark:bg-deepBlue-900/40 text-slate-600 dark:text-slate-300 hover:text-solarOrange hover:bg-slate-100 dark:hover:bg-deepBlue-800/60 transition-colors shadow-sm"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200/50 dark:border-deepBlue-800/50 shadow-2xl relative z-10 animate-slide-up">
        {/* Glow Line Top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-solarOrange to-orange-500 rounded-t-3xl"></div>

        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          {logoSrc ? (
            <img src={logoSrc} alt="Srimaan Solar Logo" className="h-16 w-auto object-contain mb-4 rounded-xl shadow-md" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-solarOrange to-amber-500 text-white font-bold text-3xl shadow-lg shadow-solarOrange/30 mb-4 animate-pulse-glow">
              S
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white text-center tracking-tight">
            {companySettings.companyName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide uppercase">
            Agent Management System
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 p-4 text-sm text-red-600 dark:text-red-400 mb-6 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all dark:focus:border-solarOrange"
                placeholder="Enter your username"
                id="login_username_input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-deepBlue-800 bg-white/50 dark:bg-deepBlue-950/40 py-3 pl-11 pr-12 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-solarOrange focus:ring-2 focus:ring-solarOrange/10 transition-all dark:focus:border-solarOrange"
                placeholder="Enter your password"
                id="login_password_input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 dark:text-slate-500 hover:text-solarOrange dark:hover:text-solarOrange transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-solarOrange to-orange-500 hover:from-solarOrange-hover hover:to-orange-600 text-white py-3.5 px-4 text-sm font-bold shadow-lg shadow-solarOrange/20 hover:shadow-xl hover:shadow-solarOrange/30 transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-[0.99] disabled:opacity-50"
            id="login_submit_btn"
          >
            {loading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-200/50 dark:border-deepBlue-800/50 pt-4 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            For Admin access, use preconfigured login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
