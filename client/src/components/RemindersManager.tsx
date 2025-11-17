import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar,
  X,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { notificationService } from '../services/NotificationService';

// 🎓 REACT CONCEPT: TypeScript interfaces for data structures
// Like Swift structs, these define the shape of our data
interface Reminder {
  id: number;
  user_id: string;
  title: string;
  message?: string;
  reminder_time: string; // HH:MM:SS format
  days_of_week: number[]; // 1=Monday, 7=Sunday
  enabled: boolean; // Changed from enabled to match database
  created_at: string;
  updated_at: string;
}

interface RemindersManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// 🎓 REACT CONCEPT: Custom hook for data fetching
// Similar to SwiftUI's @StateObject or @ObservedObject
function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReminders = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's reminders
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_time', { ascending: true });

      if (error) throw error;
      
      // Filter and validate reminders data
      const validReminders = (data || []).filter(reminder => 
        reminder && 
        reminder.id && 
        reminder.title && 
        typeof reminder.id === 'number' &&
        typeof reminder.title === 'string'
      );
      
      // Remove duplicates based on ID
      const uniqueReminders = validReminders.reduce((acc: Reminder[], reminder) => {
        const exists = acc.some((r: Reminder) => r.id === reminder.id);
        if (!exists) {
          acc.push(reminder);
        } else {
          console.warn('⚠️ Duplicate reminder found, skipping:', reminder);
        }
        return acc;
      }, []);
      
      console.log(`📝 Loaded ${uniqueReminders.length} unique reminders out of ${validReminders.length} valid, ${(data || []).length} total`);
      setReminders(uniqueReminders);
    } catch (err: any) {
      console.error('Error loading reminders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          user_id: user.id,
          ...reminder
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Validate data before adding
      if (data && data.id && data.title) {
        setReminders(prev => {
          // Check if reminder already exists to prevent duplicates
          const exists = prev.some(r => r.id === data.id);
          if (exists) {
            console.warn('⚠️ Reminder already exists, not adding duplicate:', data);
            return prev;
          }
          console.log('✅ Added reminder:', data);
          return [...prev, data];
        });
      } else {
        console.error('❌ Invalid reminder data:', data);
        throw new Error('Invalid reminder data received');
      }
    } catch (err: any) {
      console.error('Error adding reminder:', err);
      setError(err.message);
    }
  };

  const updateReminder = async (id: number, updates: Partial<Reminder>) => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Validate data before updating
      if (data && data.id && data.title) {
        setReminders(prev => prev.map(r => r.id === id ? data : r));
        console.log('✅ Updated reminder:', data);
      } else {
        console.error('❌ Invalid reminder data:', data);
        throw new Error('Invalid reminder data received');
      }
    } catch (err: any) {
      console.error('Error updating reminder:', err);
      setError(err.message);
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Error deleting reminder:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadReminders();
    
    // Initialize notification service
    notificationService.initialize();
    
    // Cleanup on unmount
    return () => {
      notificationService.destroy();
    };
  }, []);

  return { reminders, loading, error, addReminder, updateReminder, deleteReminder, refetch: loadReminders };
}

// 🎓 REACT CONCEPT: Main component - like SwiftUI's View
export default function RemindersManager({ isOpen, onClose }: RemindersManagerProps) {
  const { reminders, loading, error, addReminder, updateReminder, deleteReminder } = useReminders();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Update notification service when reminders change
  useEffect(() => {
    if (reminders.length > 0) {
      notificationService.updateReminders(reminders);
    }
  }, [reminders]);

  // WebSocket is now managed at the App level, so no need to connect/disconnect here

  if (!isOpen) return null;

  console.log('🔄 RemindersManager rendering with', reminders.length, 'reminders');
  console.log('🔄 RemindersManager instance ID:', Math.random().toString(36).substr(2, 9));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Reminders
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your hydration reminders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={async () => await notificationService.testNotification()}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Test Notification - Click to test browser notifications"
              >
                <Bell className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={() => setShowAddForm(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Add New Reminder"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Close Reminders Manager"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <div className="text-red-500 mb-4">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reminders.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      No reminders yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Create your first reminder to stay hydrated
                    </p>
                    <motion.button
                      onClick={() => setShowAddForm(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-5 h-5 inline mr-2" />
                      Add Reminder
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {reminders
                      .filter(reminder => {
                        const isValid = reminder && reminder.id && reminder.title;
                        if (!isValid) {
                          console.warn('🚫 Filtering out invalid reminder:', reminder);
                        }
                        return isValid;
                      })
                      .map((reminder, index) => {
                        const instanceId = (typeof window !== 'undefined' && (window as any).__remindersInstanceId) || 'inst';
                        const key = `reminder-${instanceId}-${reminder.id}-${index}`;
                        console.log(`🔑 Rendering reminder ${index}: id=${reminder.id}, title="${reminder.title}", key="${key}"`);
                        return (
                        <ReminderCard
                          key={key}
                          reminder={reminder}
                          index={index}
                          onEdit={setEditingReminder}
                          onToggle={updateReminder}
                          onDelete={deleteReminder}
                        />
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Add/Edit Form Modal */}
      <ReminderForm
        isOpen={showAddForm || !!editingReminder}
        onClose={() => {
          setShowAddForm(false);
          setEditingReminder(null);
        }}
        onSave={async (reminder) => {
          if (editingReminder) {
            await updateReminder(editingReminder.id, reminder);
          } else {
            await addReminder(reminder);
          }
          setShowAddForm(false);
          setEditingReminder(null);
          // Form will reset automatically via useEffect when isOpen becomes false
        }}
        initialData={editingReminder}
      />
    </AnimatePresence>
  );
}

// 🎓 REACT CONCEPT: Child component with props
// Like SwiftUI's View that takes parameters
interface ReminderCardProps {
  reminder: Reminder;
  index: number;
  onEdit: (reminder: Reminder) => void;
  onToggle: (id: number, updates: Partial<Reminder>) => void;
  onDelete: (id: number) => void;
}

function ReminderCard({ reminder, index, onEdit, onToggle, onDelete }: ReminderCardProps) {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const selectedDays = reminder.days_of_week.map(day => dayNames[day - 1]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-xl border transition-all ${
        reminder.enabled
          ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {reminder.title}
            </h3>
            {reminder.enabled ? (
              <Play className="w-4 h-4 text-green-500" />
            ) : (
              <Pause className="w-4 h-4 text-slate-400" />
            )}
          </div>
          
          {reminder.message && (
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
              {reminder.message}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(`2000-01-01T${reminder.reminder_time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {selectedDays.join(', ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <motion.button
            onClick={() => onToggle(reminder.id, { enabled: !reminder.enabled })}
            className={`p-2 rounded-lg transition-colors ${
              reminder.enabled
                ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={reminder.enabled ? 'Pause' : 'Resume'}
          >
            {reminder.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>

          <motion.button
            onClick={() => onEdit(reminder)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={() => onDelete(reminder.id)}
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// 🎓 REACT CONCEPT: Form component with state management
// Like SwiftUI's Form with @State properties
interface ReminderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  initialData?: Reminder | null;
}

function ReminderForm({ isOpen, onClose, onSave, initialData }: ReminderFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    reminder_time: '08:00',
    days_of_week: [1, 2, 3, 4, 5] as number[], // Default to weekdays
    enabled: true
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form when modal closes or when initialData changes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        title: '',
        message: '',
        reminder_time: '08:00',
        days_of_week: [1, 2, 3, 4, 5],
        enabled: true
      });
      setErrors({});
      return;
    }

    if (initialData) {
      setFormData({
        title: initialData.title,
        message: initialData.message || '',
        reminder_time: initialData.reminder_time.substring(0, 5), // Convert HH:MM:SS to HH:MM
        days_of_week: initialData.days_of_week,
        enabled: initialData.enabled
      });
    } else {
      setFormData({
        title: '',
        message: '',
        reminder_time: '08:00',
        days_of_week: [1, 2, 3, 4, 5],
        enabled: true
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.days_of_week.length === 0) {
      newErrors.days_of_week = 'Select at least one day';
    }

    // Validate that all days are between 1 and 7
    const invalidDays = formData.days_of_week.filter(day => day < 1 || day > 7);
    if (invalidDays.length > 0) {
      newErrors.days_of_week = 'Invalid day selection';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Ensure days_of_week array is sorted and contains valid values (1-7)
      const validDays = formData.days_of_week
        .filter(day => day >= 1 && day <= 7)
        .sort((a, b) => a - b);
      
      if (validDays.length === 0) {
        setErrors({ days_of_week: 'Select at least one day' });
        return;
      }

      onSave({
        ...formData,
        days_of_week: validDays,
        reminder_time: formData.reminder_time + ':00' // Convert HH:MM to HH:MM:SS
      });
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative z-[61]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Reminder' : 'Add Reminder'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-white`}
                  placeholder="e.g., Morning Hydration"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g., Start your day with a glass of water!"
                  rows={3}
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Days of Week *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dayNames.map((day, index) => {
                    const dayNumber = index + 1;
                    const isSelected = formData.days_of_week.includes(dayNumber);
                    return (
                      <motion.button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(dayNumber)}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {day}
                      </motion.button>
                    );
                  })}
                </div>
                {errors.days_of_week && (
                  <p className="text-red-500 text-sm mt-1">{errors.days_of_week}</p>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {initialData ? 'Update' : 'Create'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
