
import React from 'react';
import { Reminder } from '../types';
import { Trash2, CheckCircle, Calendar, Clock, User, Plus } from 'lucide-react';

interface DashboardProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  onAdd?: () => void;
  onComplete?: (id: string) => void;
  isHistory?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ reminders, onDelete, onAdd, onComplete, isHistory }) => {
  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600 p-4">
        <Calendar className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg text-center">{isHistory ? 'No completed tasks' : 'All caught up!'}</p>
        {!isHistory && (
          <>
            <p className="text-sm text-center mb-6">Reminders will appear here after calls or you can add one manually.</p>
            {onAdd && (
              <button 
                onClick={onAdd}
                className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition-all"
              >
                <Plus size={18} />
                Create Manual Reminder
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 relative min-h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {isHistory ? 'Past Tasks' : 'Pending Reminders'}
        </h2>
        {!isHistory && onAdd && (
          <button 
            onClick={onAdd}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <Plus size={18} />
            Add
          </button>
        )}
      </div>
      
      {reminders.map((reminder) => (
        <div 
          key={reminder.id} 
          className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-2 relative group animate-in slide-in-from-bottom-2 duration-300 transition-colors"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 pr-8">{reminder.text}</h3>
            <div className="flex gap-1">
              {onComplete && (
                <button 
                  onClick={() => onComplete(reminder.id)}
                  className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => onDelete(reminder.id)}
                className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(reminder.timestamp).toLocaleString()}
            </div>
            {reminder.contactName && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {reminder.contactName}
              </div>
            )}
          </div>
          
          {isHistory && (
            <div className="absolute top-2 right-2 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              Completed
            </div>
          )}
        </div>
      ))}

      {/* Floating Action Button inside Dashboard logic */}
      {!isHistory && onAdd && (
        <button
          onClick={onAdd}
          className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:scale-110 active:scale-95 z-40"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
