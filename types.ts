
export interface Reminder {
  id: string;
  text: string;
  timestamp: number; // Scheduled time
  createdAt: number;
  status: 'pending' | 'completed' | 'snoozed';
  contactName?: string;
}

export interface AppSettings {
  voiceEnabled: boolean;
  minCallDuration: number; // in seconds
  theme: 'light' | 'dark' | 'system';
}

export type AppView = 'dashboard' | 'settings' | 'history';

export interface CallState {
  isActive: boolean;
  startTime: number | null;
  duration: number;
  direction: 'incoming' | 'outgoing';
  contactName: string;
}
