import React from 'react';
import { Bell, Check, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NotificationsPage = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead
  } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Alert Log Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review alerts triggered by system activities, customer updates, and agent status changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-solarOrange hover:bg-solarOrange-hover text-white py-2.5 px-4 text-xs font-bold shadow-md shadow-solarOrange/10 transition-colors"
          >
            <Check className="h-4 w-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Main List */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-deepBlue-850/60 pb-4 mb-4">
          <Bell className="h-5 w-5 text-solarOrange" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            System Alerts ({unreadCount} unread)
          </h3>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-center text-slate-400 py-16 text-xs">No alerts recorded in the system.</div>
          ) : (
            notifications.map((note) => (
              <div
                key={note._id || note.id}
                className={`rounded-2xl border p-4 text-xs flex justify-between items-center gap-4 transition-all ${
                  note.read
                    ? 'border-slate-150 bg-slate-50/10 dark:border-deepBlue-800/40 dark:bg-deepBlue-950/10 text-slate-500 dark:text-slate-400'
                    : 'border-solarOrange/20 bg-solarOrange/5 dark:border-solarOrange/10 dark:bg-solarOrange/5 font-semibold text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-solarOrange bg-solarOrange/10 px-2 py-0.5 rounded-full">
                      {note.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed break-words pr-4">{note.message}</p>
                </div>

                {!note.read && (
                  <button
                    onClick={() => markNotificationRead(note._id || note.id)}
                    className="p-1.5 rounded-lg border border-solarOrange/20 hover:border-solarOrange text-solarOrange hover:bg-solarOrange/5 transition-all shrink-0"
                    title="Mark as read"
                  >
                    <Check className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
