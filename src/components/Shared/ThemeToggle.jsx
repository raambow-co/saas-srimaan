import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl border border-slate-200/60 dark:border-deepBlue-700/60 bg-white/50 dark:bg-deepBlue-800/40 text-slate-600 dark:text-slate-300 hover:text-solarOrange dark:hover:text-solarOrange hover:bg-slate-100 dark:hover:bg-deepBlue-800/80 transition-all duration-300 shadow-sm"
      aria-label="Toggle dark/light theme"
    >
      <div className="relative h-5 w-5 overflow-hidden">
        {/* Sun Icon */}
        <span
          className={`absolute inset-0 transform transition-transform duration-500 ease-spring ${
            isDark ? 'translate-y-0 rotate-0' : 'translate-y-8 rotate-45'
          }`}
        >
          <Sun className="h-5 w-5" />
        </span>
        {/* Moon Icon */}
        <span
          className={`absolute inset-0 transform transition-transform duration-500 ease-spring ${
            isDark ? '-translate-y-8 -rotate-45' : 'translate-y-0 rotate-0'
          }`}
        >
          <Moon className="h-5 w-5" />
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;
