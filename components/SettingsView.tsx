
import React from 'react';
import { AppSettings } from '../types';
import { Volume2, VolumeX, Timer, Palette, Info } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  reminderCount: number;
}

const SettingsView: React.FC<SettingsProps> = ({ settings, setSettings, reminderCount }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 transition-colors duration-300">
        {/* Voice Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.voiceEnabled ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'}`}>
              {settings.voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </div>
            <div>
              <p className="font-medium dark:text-gray-100">AI Voice Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Listen for reminder prompts after calls</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.voiceEnabled} 
              onChange={(e) => setSettings(s => ({ ...s, voiceEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {/* Min Duration Slider */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <Timer size={20} />
            </div>
            <div>
              <p className="font-medium dark:text-gray-100">Minimum Call Duration</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Only nudge after calls longer than {settings.minCallDuration}s</p>
            </div>
          </div>
          <input 
            type="range" 
            min="0" 
            max="60" 
            step="5"
            value={settings.minCallDuration}
            onChange={(e) => setSettings(s => ({ ...s, minCallDuration: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
          />
        </div>

        {/* Theme Picker */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Palette size={20} />
            </div>
            <div>
              <p className="font-medium dark:text-gray-100">App Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current: {settings.theme}</p>
            </div>
          </div>
          <select 
            value={settings.theme}
            onChange={(e) => setSettings(s => ({ ...s, theme: e.target.value as any }))}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
        <Info className="text-blue-500 dark:text-blue-400 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-semibold">App Statistics</p>
          <p className="mt-1">Active Reminders: {reminderCount} / 100</p>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-gray-400 dark:text-gray-600">Call Nudge v1.0.0 (AI Flash Preview)</p>
      </div>
    </div>
  );
};

export default SettingsView;
