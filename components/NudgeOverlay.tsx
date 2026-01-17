import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Reminder } from '../types';
import { X, Mic, Send, Calendar, Clock, Loader2, Volume2, Check, Edit2, Trash2 } from 'lucide-react';
import { parseReminderText, getVoicePrompt } from '../services/geminiService';
import { playAudio } from '../services/audio';

interface NudgeOverlayProps {
  contact: string;
  voiceEnabled: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>) => void;
}

type NudgeMode = 'confirm' | 'input' | 'processing' | 'review';

const NudgeOverlay: React.FC<NudgeOverlayProps> = ({ contact, voiceEnabled, onClose, onSave }) => {
  const [mode, setMode] = useState<NudgeMode>('confirm');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState(30);
  const [parsedData, setParsedData] = useState<{task: string, timestamp: number} | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startListening = useCallback((autoSubmit: boolean = true) => {
    if (!('webkitSpeechRecognition' in window)) return;
    
    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      
      if (mode === 'confirm') {
        if (text.includes('yes') || text.includes('sure') || text.includes('yeah')) {
          handleYes();
        } else if (text.includes('no') || text.includes('skip') || text.includes('cancel')) {
          onClose();
        }
      } else if (autoSubmit) {
        setInputText(text);
        handleProcessInput(text);
      } else {
        setInputText(text);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  }, [mode, onClose]);

  // Handle auto-close timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setAutoCloseTimer(t => {
        if (t <= 1) {
          onClose();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onClose]);

  // Phase 1: Confirmation
  useEffect(() => {
    const initPrompt = async () => {
      if (voiceEnabled && mode === 'confirm') {
        const audio = await getVoicePrompt(`Would you like to set a reminder for your call with ${contact}?`);
        if (audio) await playAudio(audio);
        startListening(false); // Listen for Yes/No
      }
    };
    initPrompt();
  }, [contact, voiceEnabled, startListening, mode]);

  const handleYes = async () => {
    setMode('input');
    setAutoCloseTimer(45); // Extend timer for input
    if (voiceEnabled) {
      const audio = await getVoicePrompt(`Great. What should I remember and for what time?`);
      if (audio) await playAudio(audio);
      startListening(true); // Automatically process the next speech as the task
    }
  };

  const handleProcessInput = async (textToParse: string) => {
    const text = textToParse || inputText;
    if (!text.trim()) return;
    
    setMode('processing');
    const result = await parseReminderText(text);
    
    if (result && result.task) {
      setParsedData({
        task: result.task,
        timestamp: result.timestamp
      });
      setMode('review');
    } else {
      setMode('input');
      alert("AI couldn't understand the task. Please try again.");
    }
  };

  const handleFinalConfirm = () => {
    if (parsedData) {
      onSave({
        text: parsedData.task,
        timestamp: parsedData.timestamp,
        contactName: contact
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-950 w-full max-w-md rounded-t-[3rem] shadow-2xl p-8 pb-12 space-y-8 animate-in slide-in-from-bottom-full duration-500 border-t border-gray-200 dark:border-gray-800">
        
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${mode === 'confirm' ? 'w-10 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-800'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-500 ${mode === 'input' ? 'w-10 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-800'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-500 ${mode === 'processing' || mode === 'review' ? 'w-10 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-800'}`} />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'ring-4 ring-blue-500/30 scale-110 shadow-lg' : ''}`}>
              <Mic size={24} className={isListening ? 'text-blue-600 animate-pulse' : 'text-blue-500'} />
            </div>
            <div>
              <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Call Nudge</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Post-Call Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 1. Confirmation Screen */}
        {mode === 'confirm' && (
          <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight">Create a reminder?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Just finished talking to <span className="text-blue-600 dark:text-blue-400 font-bold">{contact}</span></p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onClose}
                className="py-5 px-6 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-3xl font-black text-lg hover:bg-gray-200 transition-all active:scale-95"
              >
                SKIP ({autoCloseTimer}s)
              </button>
              <button 
                onClick={handleYes}
                className="py-5 px-6 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Check size={24} /> YES
              </button>
            </div>
          </div>
        )}

        {/* 2. Input Screen */}
        {mode === 'input' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">Tell me the task</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-bold">What should I remember?</p>
            </div>

            {voiceEnabled ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                  <div className="absolute -inset-4 bg-blue-500/10 rounded-full animate-pulse" />
                  <div className="relative w-28 h-28 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Mic size={48} className="text-white" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-blue-600 dark:text-blue-400 font-black text-xl animate-pulse">I'm listening...</p>
                  <p className="text-sm text-gray-400 italic">"Remind me to send the files tomorrow at 2pm"</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleProcessInput(inputText)}
                    className="px-10 py-4 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95"
                  >
                    Done Speaking
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea 
                  autoFocus
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g. Call back in 10 minutes..."
                  className="w-full h-40 p-6 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-[2rem] outline-none text-xl font-medium text-gray-800 dark:text-gray-100 transition-all resize-none shadow-inner"
                />
                <button 
                  disabled={!inputText.trim()}
                  onClick={() => handleProcessInput(inputText)}
                  className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send size={24} /> SET REMINDER
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Processing Screen */}
        {mode === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative w-20 h-20">
              <Loader2 className="w-20 h-20 text-blue-600 animate-spin" strokeWidth={3} />
              <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-blue-400 animate-bounce" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">AI Processing</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 italic">Extracting task and time with Gemini...</p>
            </div>
          </div>
        )}

        {/* 4. Review Screen */}
        {mode === 'review' && parsedData && (
          <div className="space-y-8 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Review Reminder</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ready to save</p>
            </div>
            
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-8 rounded-[2.5rem] border-2 border-blue-100 dark:border-blue-900/30 space-y-8">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-white dark:bg-gray-800 shadow-lg text-blue-600 rounded-2xl"><Send size={24}/></div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">The Task</label>
                  <p className="text-xl text-gray-900 dark:text-gray-100 font-black leading-none">{parsedData.task}</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="p-4 bg-white dark:bg-gray-800 shadow-lg text-orange-500 rounded-2xl"><Clock size={24}/></div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">The Time</label>
                  <p className="text-xl text-gray-900 dark:text-gray-100 font-black leading-none">
                    {new Date(parsedData.timestamp).toLocaleString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMode('input')}
                className="py-5 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-3xl font-black text-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Edit2 size={20} /> EDIT
              </button>
              <button 
                onClick={handleFinalConfirm}
                className="py-5 bg-green-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-green-500/30 flex items-center justify-center gap-2 active:scale-95"
              >
                <Check size={24} /> SAVE
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 flex justify-center gap-10 text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-[0.25em] font-black">
          <div className="flex items-center gap-2"><Calendar size={14} className="text-blue-500"/> Smart Scheduling</div>
          {voiceEnabled && <div className="flex items-center gap-2 text-blue-500 animate-pulse"><Volume2 size={14}/> Audio Assist</div>}
        </div>
      </div>
    </div>
  );
};

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L14.5 9L21 11.5L14.5 14L12 21L9.5 14L3 11.5L9.5 9L12 3Z" fill="currentColor" />
  </svg>
);

export default NudgeOverlay;