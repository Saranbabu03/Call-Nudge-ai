
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Reminder } from '../types';
import { X, Mic, Send, Calendar, Clock, Loader2, Volume2, Check, Edit2 } from 'lucide-react';
import { parseReminderText, getVoicePrompt } from '../services/geminiService';
import { playAudio } from '../services/audio';

interface NudgeOverlayProps {
  contact: string;
  voiceEnabled: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>) => void;
}

const NudgeOverlay: React.FC<NudgeOverlayProps> = ({ contact, voiceEnabled, onClose, onSave }) => {
  const [mode, setMode] = useState<'input' | 'processing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState(45); // Extended for the review flow
  const [parsedData, setParsedData] = useState<{task: string, timestamp: number} | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    
    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInputText(text);
      setIsListening(false);
      // Auto-submit voice input
      handleProcessInput(text);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  }, []);

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

  useEffect(() => {
    const initNudge = async () => {
      if (voiceEnabled) {
        // Updated voice prompt to be more directive about "what" and "when"
        const audio = await getVoicePrompt(`Call with ${contact} ended. What should I remember for you, and for what time?`);
        if (audio) await playAudio(audio);
        startListening();
      }
    };
    initNudge();
  }, [contact, voiceEnabled, startListening]);

  const handleProcessInput = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setMode('processing');
    
    const result = await parseReminderText(textToParse);
    
    if (result && result.task) {
      setParsedData({
        task: result.task,
        timestamp: result.timestamp
      });
      setMode('review');
    } else {
      setMode('input');
      alert("AI couldn't find a clear task or time. Please try typing it.");
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl shadow-2xl p-6 pb-8 space-y-6 animate-in slide-in-from-bottom-full duration-500 transition-colors">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className={`w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center ${isListening ? 'animate-pulse scale-110' : ''}`}>
              <Mic size={18} />
            </div>
            <span className="font-semibold">Call Nudge AI</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500">
            <X size={20} />
          </button>
        </div>

        {mode === 'input' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Post-Call Reminder</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {voiceEnabled ? 'Listening for task and time...' : `Call with ${contact} ended`}
              </p>
            </div>

            <div className="relative">
              <textarea 
                autoFocus
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={voiceEnabled ? "Speaking..." : "What should I remember and when? (e.g. Call back tomorrow at 2pm)"}
                className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors"
              />
              <button 
                onClick={startListening}
                className={`absolute right-3 bottom-3 p-3 rounded-full shadow-md transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600'}`}
              >
                <Mic size={20} />
              </button>
            </div>
            
            <div className="flex gap-2">
               <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-medium">
                Dismiss ({autoCloseTimer}s)
              </button>
              <button 
                disabled={!inputText.trim()}
                onClick={() => handleProcessInput(inputText)}
                className="flex-[2] py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg"
              >
                <Send size={18} />
                Confirm
              </button>
            </div>
          </div>
        )}

        {mode === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="font-medium text-gray-800 dark:text-gray-200">Processing with Gemini...</p>
          </div>
        )}

        {mode === 'review' && parsedData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Review Reminder</h3>
              <p className="text-sm text-gray-500">Is this correct?</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Send size={16}/></div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Task</label>
                  <p className="text-gray-800 dark:text-gray-100 font-medium">{parsedData.task}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg"><Clock size={16}/></div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Scheduled For</label>
                  <p className="text-gray-800 dark:text-gray-100 font-medium">
                    {new Date(parsedData.timestamp).toLocaleString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setMode('input')}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button 
                onClick={handleFinalConfirm}
                className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <Check size={20} />
                Looks Good!
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-center gap-6 text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest font-semibold">
          <div className="flex items-center gap-1"><Calendar size={12}/> AI Date Detection</div>
          {voiceEnabled && mode !== 'review' && <div className="flex items-center gap-1 text-blue-500 animate-pulse"><Volume2 size={12}/> Voice Active</div>}
        </div>
      </div>
    </div>
  );
};

export default NudgeOverlay;
