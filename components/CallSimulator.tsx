
import React, { useState, useEffect, useRef } from 'react';
import { CallState } from '../types';
import { PhoneOff, Mic, User, Grid, Volume2 } from 'lucide-react';

interface SimulatorProps {
  callState: CallState;
  setCallState: React.Dispatch<React.SetStateAction<CallState>>;
  onCallEnd: (summary: { contact: string; duration: number }) => void;
}

const CallSimulator: React.FC<SimulatorProps> = ({ callState, setCallState, onCallEnd }) => {
  const [timer, setTimer] = useState(0);
  // Using ReturnType<typeof setInterval> instead of NodeJS.Timeout for browser compatibility
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    const finalDuration = timer;
    const contact = callState.contactName;
    setCallState({
      isActive: false,
      startTime: null,
      duration: 0,
      direction: 'outgoing',
      contactName: 'Unknown'
    });
    onCallEnd({ contact, duration: finalDuration });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-between py-20 px-6 text-white animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-800">
          <User className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-light">Sarah Jenkins</h2>
        <p className="text-blue-400 uppercase tracking-widest text-sm">On Call - {formatTime(timer)}</p>
      </div>

      <div className="grid grid-cols-3 gap-8 w-full max-w-xs">
        {[
          { icon: Mic, label: 'Mute' },
          { icon: Grid, label: 'Keypad' },
          { icon: Volume2, label: 'Speaker' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <button className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
              <item.icon className="w-6 h-6" />
            </button>
            <span className="text-xs text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={handleHangUp}
        className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-xl hover:scale-105 active:scale-95"
      >
        <PhoneOff className="w-8 h-8" />
      </button>
    </div>
  );
};

export default CallSimulator;
