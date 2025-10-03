import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Monitor, Type, Contrast } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/AuthContext';
import CustomAlert from './CustomAlert';

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

type ThemeMode = 'system' | 'light' | 'dark';

interface Preferences {
  theme: ThemeMode;
  highContrast: boolean;
  largeText: boolean;
}

export default function UserPreferences({ isOpen, onClose }: UserPreferencesProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'system',
    highContrast: false,
    largeText: false,
  });
  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  // Load preferences from database and apply them
  useEffect(() => {
    if (user && isOpen) {
      loadPreferences();
    }
  }, [user, isOpen]);

  // Apply theme on mount and when preferences change
  useEffect(() => {
    applyTheme(preferences);
  }, [preferences]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        const loadedPreferences = {
          theme: data.theme || 'system',
          highContrast: data.high_contrast || false,
          largeText: data.large_text || false,
        };
        setPreferences(loadedPreferences);
        applyTheme(loadedPreferences);
      } else if (error && error.code === 'PGRST116') {
        // No preferences found, create default
        await createDefaultPreferences();
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          theme: 'system',
          high_contrast: false,
          large_text: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating default preferences:', error);
      }
    } catch (err) {
      console.error('Error creating default preferences:', err);
    }
  };

  const savePreferences = async (newPreferences: Partial<Preferences>) => {
    if (!user) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    setSaving(true);
    try {
      // First, try to update
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({
          theme: updatedPreferences.theme,
          high_contrast: updatedPreferences.highContrast,
          large_text: updatedPreferences.largeText,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // If no rows were updated, insert instead
      if (updateError && updateError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            theme: updatedPreferences.theme,
            high_contrast: updatedPreferences.highContrast,
            large_text: updatedPreferences.largeText,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      // Apply theme immediately
      applyTheme(updatedPreferences);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setAlertConfig({
        isOpen: true,
        message: `Failed to save preferences: ${error.message || 'Please try again.'}`,
        type: 'error',
        title: 'Error'
      });
      // Revert preferences on error
      loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (prefs: Preferences) => {
    const root = document.documentElement;
    
    // Apply theme
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else if (prefs.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply high contrast
    if (prefs.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply large text
    if (prefs.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
  };

  const themeOptions: { value: ThemeMode; label: string; icon: any }[] = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  if (!isOpen) return null;

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
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Preferences</h2>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} className="text-slate-500 dark:text-slate-400" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Theme Selection */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sun size={20} className="text-blue-500" />
                Theme Selection
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = preferences.theme === option.value;
                  
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => savePreferences({ theme: option.value })}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={saving}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon 
                          size={24} 
                          className={isSelected ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'} 
                        />
                        <span className={`font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {option.label}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId="theme-indicator"
                          className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* High Contrast Mode */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Contrast size={20} className="text-purple-500" />
                High Contrast Mode
              </h3>
              <motion.button
                onClick={() => savePreferences({ highContrast: !preferences.highContrast })}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${preferences.highContrast
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={saving}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${preferences.highContrast ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}
                    `}>
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                        animate={{ x: preferences.highContrast ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {preferences.highContrast ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Increases contrast for better visibility
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Large Text Option */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Type size={20} className="text-green-500" />
                Large Text Option
              </h3>
              <motion.button
                onClick={() => savePreferences({ largeText: !preferences.largeText })}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all text-left
                  ${preferences.largeText
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={saving}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${preferences.largeText ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}
                    `}>
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                        animate={{ x: preferences.largeText ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {preferences.largeText ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Increases text size throughout the app
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Preview Section */}
            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Preview
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Your changes are applied immediately and will be saved automatically.
              </p>
              {saving && (
                <p className="text-sm text-blue-500 mt-2">
                  Saving preferences...
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        message={alertConfig.message}
        type={alertConfig.type}
        title={alertConfig.title}
      />
    </AnimatePresence>
  );
}

