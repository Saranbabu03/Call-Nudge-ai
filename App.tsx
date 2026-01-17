
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Reminder, AppSettings, AppView, CallState } from './types';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';
import NudgeOverlay from './components/NudgeOverlay';
import CallSimulator from './components/CallSimulator';
import ManualReminderModal from './components/ManualReminderModal';
import { Bell, Settings, Home, History, Phone } from 'lucide-react';

const STORAGE_KEY = 'call_nudge_reminders';
const SETTINGS_KEY = 'call_nudge_settings';

const App: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    voiceEnabled: true,
    minCallDuration: 10,
    theme: 'system'
  });
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    startTime: null,
    duration: 0,
    direction: 'outgoing',
    contactName: 'Unknown'
  });
  const [showNudge, setShowNudge] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [lastCallSummary, setLastCallSummary] = useState<{ contact: string; duration: number } | null>(null);

  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    matcher.addEventListener('change', onChange);
    return () => matcher.removeEventListener('change', onChange);
  }, []);

  const isDarkMode = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return isSystemDark;
  }, [settings.theme, isSystemDark]);

  useEffect(() => {
    const savedReminders = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedReminders) setReminders(JSON.parse(savedReminders));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const addReminder = useCallback((reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>) => {
    if (reminders.length >= 100) {
      alert("Limit of 100 reminders reached.");
      return;
    }
    const newReminder: Reminder = {
      ...reminder,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      status: 'pending'
    };
    setReminders(prev => [newReminder, ...prev]);
  }, [reminders.length]);

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleCallEnded = (summary: { contact: string; duration: number }) => {
    if (summary.duration >= settings.minCallDuration) {
      setLastCallSummary(summary);
      setTimeout(() => {
        setShowNudge(true);
      }, 3000);
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <header className="bg-blue-600 dark:bg-blue-700 text-white p-4 shadow-md flex justify-between items-center z-20">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6" />
            <h1 className="text-xl font-bold">Call Nudge</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-500/50 px-2 py-1 rounded uppercase font-bold">Demo Mode</span>
            <button 
              title="Simulate Incoming Call"
              onClick={() => setCallState(prev => ({ ...prev, isActive: !prev.isActive, contactName: 'Sarah Jenkins' }))}
              className={`p-2 rounded-full transition-colors ${callState.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
          {callState.isActive ? (
            <CallSimulator 
              callState={callState} 
              setCallState={setCallState} 
              onCallEnd={handleCallEnded} 
            />
          ) : (
            <>
              {currentView === 'dashboard' && (
                <Dashboard 
                  reminders={reminders.filter(r => r.status !== 'completed')} 
                  onDelete={deleteReminder} 
                  onAdd={() => setShowManualModal(true)}
                  onComplete={(id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r))}
                />
              )}
              {currentView === 'history' && (
                <Dashboard 
                  reminders={reminders.filter(r => r.status === 'completed')} 
                  onDelete={deleteReminder}
                  isHistory
                />
              )}
              {currentView === 'settings' && (
                <SettingsView 
                  settings={settings} 
                  setSettings={setSettings} 
                  reminderCount={reminders.length}
                />
              )}
            </>
          )}
        </main>

        <nav className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around p-3 z-10 transition-colors duration-300">
          <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button onClick={() => setCurrentView('history')} className={`flex flex-col items-center gap-1 ${currentView === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <History className="w-6 h-6" />
            <span className="text-xs">History</span>
          </button>
          <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-1 ${currentView === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <Settings className="w-6 h-6" />
            <span className="text-xs">Settings</span>
          </button>
        </nav>

        {showNudge && lastCallSummary && (
          <NudgeOverlay 
            contact={lastCallSummary.contact}
            voiceEnabled={settings.voiceEnabled}
            onClose={() => setShowNudge(false)}
            onSave={addReminder}
          />
        )}

        {showManualModal && (
          <ManualReminderModal 
            onClose={() => setShowManualModal(false)}
            onSave={addReminder}
          />
        )}
      </div>
    </div>
  );
};

export default App;
