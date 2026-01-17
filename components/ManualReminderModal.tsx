
import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { X, Mic, Send, Calendar, Loader2, Clock, Sparkles } from 'lucide-react';
import { parseReminderText } from '../services/geminiService';

interface ManualReminderModalProps {
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>) => void;
}

const ManualReminderModal: React.FC<ManualReminderModalProps> = ({ onClose, onSave }) => {
  const [task, setTask] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const now = new Date();
    // Round to next 30 mins
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  const handleSmartFill = async () => {
    if (!task.trim()) return;
    setIsProcessing(true);

    const result = await parseReminderText(task);
    
    if (result && result.task) {
      setTask(result.task);
      const parsedDate = new Date(result.timestamp);
      setDate(parsedDate.toISOString().split('T')[0]);
      setTime(parsedDate.toTimeString().slice(0, 5));
    } else {
      alert("AI couldn't find a specific time. Please set it manually using the fields below.");
    }
    setIsProcessing(false);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    
    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTask(text);
      setIsListening(false);
      setTimeout(() => handleSmartFill(), 500);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleFinalSave = () => {
    if (!task.trim() || !date || !time) return;
    const scheduledTimestamp = new Date(`${date}T${time}`).getTime();
    onSave({
      text: task,
      timestamp: scheduledTimestamp,
      contactName: 'Manual Entry'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-300 transition-colors">
        
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Set New Reminder</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Task Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">1. What is the task?</label>
            <div className="relative">
              <textarea 
                autoFocus
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Example: Call mom back"
                className="w-full h-24 p-4 pr-12 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all resize-none shadow-inner"
              />
              <button 
                onClick={startListening}
                className={`absolute right-3 top-3 p-2 rounded-xl shadow-sm transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600'}`}
              >
                <Mic size={18} />
              </button>
            </div>
          </div>

          {/* Date & Time Fields */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">2. When should I remind you?</label>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-3 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            
            <button 
              onClick={handleSmartFill}
              disabled={!task.trim() || isProcessing}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-1 rounded-lg disabled:opacity-40"
            >
              {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AUTOFILL FROM TASK TEXT
            </button>
          </div>
          
          <button 
            disabled={!task.trim() || !date || !time}
            onClick={handleFinalSave}
            className="w-full py-4 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            CREATE REMINDER
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualReminderModal;
