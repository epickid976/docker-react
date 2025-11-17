import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../supabaseClient";
import { Droplets, Clock, Smartphone, Watch, Edit, Trash2, Plus, X, Info, User, BarChart3, Bell, Settings, Lightbulb, Upload, Shield, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUnitPreferences } from "../hooks/useUnitPreferences";
import { UnitSelector, UnitSelectorCompact } from "../components/UnitSelector";
import { MeasureUnit, convertAmount } from "../utils/unitConversions";
import { ProfileManager } from "../components/ProfileManager";
import { ProfileSetup } from "../components/ProfileSetup";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import RemindersManager from "../components/RemindersManager";
import UserPreferences from "../components/UserPreferences";
import SmartRecommendations from "../components/SmartRecommendations";
import CustomAlert from "../components/CustomAlert";
import DataImporter from "../components/DataImporter";
import WearableSync from "../components/WearableSync";

// 🎓 REACT CONCEPT: TypeScript interfaces are like Swift structs
// In SwiftUI: struct User { let id: UUID; let name: String }
// In React: interface User { id: string; name: string; }
// TEST: Hot reload test - this should update automatically - UPDATED!
interface WaterEntry {
  id: number;
  amount_ml: number;
  entry_ts: string;
  source: 'manual' | 'reminder' | 'import' | 'wearable';
  note?: string;
}

interface DailyGoal {
  goal_ml: number;
  recommended_goal_ml?: number;
}

// 🎓 REACT CONCEPT: Custom hooks are like SwiftUI @StateObject or @ObservedObject
// This is like creating a ViewModel in SwiftUI that manages state
function useWaterData() {
  // 🎓 REACT CONCEPT: useState is like @State in SwiftUI
  // In SwiftUI: @State private var entries: [WaterEntry] = []
  // In React: const [entries, setEntries] = useState<WaterEntry[]>([])
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎓 REACT CONCEPT: useEffect is like .onAppear() or .task() in SwiftUI
  // This runs when the component mounts (like .onAppear)
  useEffect(() => {
    loadData();
  }, []); // Empty dependency array = run once on mount

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get the current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Load today's water entries for this user
      const { data: entriesData, error: entriesError } = await supabase
        .from('hydration_entries')
        .select('*')
        .eq('user_id', user.id) // 🎓 Filter by current user
        .gte('entry_ts', new Date().toISOString().split('T')[0]) // Today only
        .order('entry_ts', { ascending: false });

      if (entriesError) throw entriesError;

      // Load daily goal for this user
      const { data: goalData, error: goalError } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id) // 🎓 Filter by current user
        .single();

      if (goalError && goalError.code !== 'PGRST116') throw goalError;

      setEntries(entriesData || []);
      setDailyGoal(goalData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🎓 REACT CONCEPT: Functions that update state are like methods in SwiftUI ViewModels
  const addWaterEntry = async (amount: number, note?: string) => {
    try {
      // Get the current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('hydration_entries')
        .insert([{
          user_id: user.id, // 🎓 This is crucial for RLS policies!
          amount_ml: amount,
          source: 'manual',
          note: note
        }])
        .select()
        .single();

      if (error) throw error;
      
      // 🎓 REACT CONCEPT: Updating state is like updating @Published properties
      // In SwiftUI: entries.append(newEntry)
      // In React: setEntries(prev => [...prev, newEntry])
      setEntries(prev => [data, ...prev]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🎓 REACT CONCEPT: Delete function - like removing from an array in SwiftUI
  const deleteWaterEntry = async (entryId: number) => {
    try {
      const { error } = await supabase
        .from('hydration_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      
      // 🎓 REACT CONCEPT: Remove from state array
      // In SwiftUI: entries.removeAll { $0.id == entryId }
      // In React: setEntries(prev => prev.filter(entry => entry.id !== entryId))
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🎓 REACT CONCEPT: Update function - like modifying an array element in SwiftUI
  const updateWaterEntry = async (entryId: number, amount: number, note?: string) => {
    try {
      const { data, error } = await supabase
        .from('hydration_entries')
        .update({
          amount_ml: amount,
          note: note
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      
      // 🎓 REACT CONCEPT: Update specific item in state array
      // In SwiftUI: entries[index] = updatedEntry
      // In React: setEntries(prev => prev.map(entry => entry.id === entryId ? data : entry))
      setEntries(prev => prev.map(entry => entry.id === entryId ? data : entry));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { entries, dailyGoal, loading, error, addWaterEntry, deleteWaterEntry, updateWaterEntry, refreshData: loadData };
}

// 🎓 REACT CONCEPT: Components are like SwiftUI Views
// This is like a SwiftUI View that displays a water entry
function WaterEntryCard({ 
  entry, 
  onEdit, 
  onDelete,
  isRemoving = false,
  unit = 'ml'
}: { 
  entry: WaterEntry;
  onEdit: (entry: WaterEntry) => void;
  onDelete: (entryId: number) => void;
  isRemoving?: boolean;
  unit?: MeasureUnit;
}) {
  // 🎓 REACT CONCEPT: Props are like parameters passed to SwiftUI Views
  // In SwiftUI: struct WaterEntryCard: View { let entry: WaterEntry; let onEdit: (WaterEntry) -> Void }
  // In React: function WaterEntryCard({ entry, onEdit, onDelete }: { entry: WaterEntry; onEdit: (entry: WaterEntry) => void })
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Convert amount to user's preferred unit
  const convertFromMl = (ml: number): number => {
    return convertAmount(ml, 'ml', unit);
  };

  const formatAmountWithUnit = (amount: number): string => {
    const converted = convertFromMl(amount);
    const rounded = Math.round(converted * 10) / 10;
    return `${rounded}${unit}`;
  };

  // 🎓 REACT CONCEPT: Event handlers with parameters
  // In SwiftUI: Button("Edit") { onEdit(entry) }
  // In React: onClick={() => onEdit(entry)}
  const handleEdit = () => onEdit(entry);
  const handleDelete = () => onDelete(entry.id);

  return (
    <motion.div 
      className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700"
      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {formatAmountWithUnit(entry.amount_ml)}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {formatTime(entry.entry_ts)}
          </div>
          {entry.note && (
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {entry.note}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-slate-500 dark:text-slate-400">
            {entry.source === 'manual' ? <Droplets size={20} /> : 
             entry.source === 'reminder' ? <Clock size={20} /> : 
             entry.source === 'import' ? <Smartphone size={20} /> : <Watch size={20} />}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-1">
            <button
              onClick={handleEdit}
              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded hover:scale-110"
              title="Edit entry"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded hover:scale-110"
              title="Delete entry"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 🎓 REACT CONCEPT: This is the main component, like a SwiftUI ContentView
export default function DashboardPage() {
  const { user, profile, needsProfileSetup, setProfile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (profile as any)?.role === 'SYSTEM_ADMIN' || (profile as any)?.is_admin === true;
  
  const { entries, dailyGoal, loading, error, addWaterEntry, deleteWaterEntry, updateWaterEntry, refreshData: loadData } = useWaterData();
  const { 
    unit, 
    setUnit, 
    convertFromMl, 
    convertToMl, 
    formatAmountWithUnit, 
    getQuickAmountsForUnit, 
    getRecommendedGoalForUnit 
  } = useUnitPreferences();
  
  // 🎓 REACT CONCEPT: Local state for UI interactions
  // In SwiftUI: @State private var showingAddWater = false
  const [showingAddWater, setShowingAddWater] = useState(false);
  const [newAmount, setNewAmount] = useState(250); // Default 250ml
  const [newNote, setNewNote] = useState('');
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

  // 🎓 REACT CONCEPT: Update default amount when unit changes
  // Like SwiftUI's onAppear or onChange
  useEffect(() => {
    // Set appropriate default based on unit
    const defaults = {
      'ml': 250,
      'oz': 8,
      'cup': 1,
      'bottle': 1
    };
    setNewAmount(defaults[unit] || 250);
  }, [unit]);
  
  // 🎓 REACT CONCEPT: State for editing functionality
  // In SwiftUI: @State private var editingEntry: WaterEntry? = nil
  const [editingEntry, setEditingEntry] = useState<WaterEntry | null>(null);
  const [editAmount, setEditAmount] = useState(250);
  const [editNote, setEditNote] = useState('');
  
  // 🎓 REACT CONCEPT: State for UI interactions
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileSetupCompleted, setProfileSetupCompleted] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showWearableSync, setShowWearableSync] = useState(false);

  // 🎓 REACT CONCEPT: useEffect for side effects (like SwiftUI's onAppear)
  // This handles clicking outside the popup to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showInfoPopup) {
        const target = event.target as Element;
        if (!target.closest('[data-info-popup]')) {
          setShowInfoPopup(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInfoPopup]);

  // Reset profile setup completion when user changes
  useEffect(() => {
    setProfileSetupCompleted(false);
  }, [user]);

  // Show profile setup for new users
  useEffect(() => {
    if (needsProfileSetup && !profileSetupCompleted) {
      setShowProfileSetup(true);
    } else if (!needsProfileSetup && showProfileSetup) {
      setShowProfileSetup(false);
    }
  }, [needsProfileSetup, profileSetupCompleted, showProfileSetup]);

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (!error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error refreshing profile:', err);
      }
    }
  };

  // Calculate today's total
  const todayTotal = entries.reduce((sum, entry) => sum + entry.amount_ml, 0);
  const goalAmount = dailyGoal?.goal_ml || 2000; // Default 2L
  const progressPercentage = Math.min((todayTotal / goalAmount) * 100, 100);
  
  // Convert to user's preferred unit
  const todayTotalInUnit = convertFromMl(todayTotal);
  const goalAmountInUnit = convertFromMl(goalAmount);
  const remainingInUnit = convertFromMl(goalAmount - todayTotal);

  // 🎓 REACT CONCEPT: Event handlers are like SwiftUI action closures
  const handleAddWater = async () => {
    if (newAmount > 0) {
      try {
        // Convert from user's preferred unit to ml before saving
        const amountInMl = Math.round(convertToMl(newAmount));
        await addWaterEntry(amountInMl, newNote || undefined);
        
        // Reset to unit-appropriate default
        const defaults = {
          'ml': 250,
          'oz': 8,
          'cup': 1,
          'bottle': 1
        };
        setNewAmount(defaults[unit] || 250);
        setNewNote('');
        setShowingAddWater(false);
        
        // The new entry will automatically animate in due to the staggered animation
        // in the entries mapping with animationDelay
      } catch (error) {
        console.error('Error adding water entry:', error);
        setAlertConfig({
          isOpen: true,
          message: 'Failed to add water entry. Please try again.',
          type: 'error',
          title: 'Error'
        });
      }
    }
  };

  // 🎓 REACT CONCEPT: Edit handler - like a SwiftUI action that sets editing state
  const handleEditEntry = (entry: WaterEntry) => {
    setEditingEntry(entry);
    setEditAmount(convertFromMl(entry.amount_ml));
    setEditNote(entry.note || '');
  };

  // 🎓 REACT CONCEPT: Save edit handler - like a SwiftUI action that updates data
  const handleSaveEdit = async () => {
    if (editingEntry && editAmount > 0) {
      // Convert from user's preferred unit to ml before saving
      const amountInMl = Math.round(convertToMl(editAmount));
      await updateWaterEntry(editingEntry.id, amountInMl, editNote || undefined);
      setEditingEntry(null);
      
      // Reset to unit-appropriate default
      const defaults = {
        'ml': 250,
        'oz': 8,
        'cup': 1,
        'bottle': 1
      };
      setEditAmount(defaults[unit] || 250);
      setEditNote('');
    }
  };

  // 🎓 REACT CONCEPT: Delete handler with animation - like a SwiftUI action that removes data
  const handleDeleteEntry = async (entryId: number) => {
    if (window.confirm('Are you sure you want to delete this water entry?')) {
      try {
        // Start removal animation
        setRemovingEntryId(entryId.toString());
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await deleteWaterEntry(entryId);
    } catch (error) {
      console.error('Error deleting water entry:', error);
      setAlertConfig({
        isOpen: true,
        message: 'Failed to delete water entry. Please try again.',
        type: 'error',
        title: 'Error'
      });
    } finally {
        setRemovingEntryId(null);
      }
    }
  };

  // 🎓 REACT CONCEPT: Cancel edit handler - like a SwiftUI action that resets state
  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditAmount(250);
    setEditNote('');
  };

  // 🎓 REACT CONCEPT: Conditional rendering is like SwiftUI if statements
  // In SwiftUI: if loading { ProgressView() } else { ContentView() }
  // In React: {loading ? <div>Loading...</div> : <div>Content</div>}
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Droplets className="text-blue-600 animate-pulse" size={48} />
          </div>
          <div className="text-slate-600 dark:text-slate-400">Loading your hydration data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <X className="text-red-600" size={48} />
          </div>
          <div className="text-red-600 dark:text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <h1 
                className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => navigate('/dashboard')}
              >
                <Droplets className="text-blue-600" size={28} />
                GoutDeau
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Welcome back, {profile?.display_name || user?.email}
              </p>
            </div>
            
            {/* Mobile: Full-width layout | Desktop: horizontal row */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Icon buttons grid on mobile (3x2 for 6 buttons), row on desktop */}
              <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-2">
                <motion.button
                  onClick={() => setShowAnalytics(true)}
                  className="p-3 sm:p-2 text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Analytics & Insights"
                >
                  <BarChart3 size={20} />
                </motion.button>
                
                <motion.button
                  onClick={() => setShowRecommendations(true)}
                  className="p-3 sm:p-2 text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Smart Recommendations"
                >
                  <Lightbulb size={20} />
                </motion.button>
                
                <motion.button
                  onClick={() => setShowImporter(true)}
                  className="p-3 sm:p-2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Import Data"
                >
                  <Upload size={20} />
                </motion.button>
                
                <motion.button
                  onClick={() => setShowReminders(true)}
                  className="p-3 sm:p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Reminders"
                >
                  <Bell size={20} />
                </motion.button>
                
                <motion.button
                  onClick={() => setShowProfileManager(true)}
                  className="p-3 sm:p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Profile Settings"
                >
                  <User size={20} />
                </motion.button>
                
                <motion.button
                  onClick={() => setShowPreferences(true)}
                  className="p-3 sm:p-2 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="User Preferences"
                >
                  <Settings size={20} />
                </motion.button>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="p-3 sm:p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                    title="Admin Panel"
                  >
                    <Shield size={20} />
                  </Link>
                )}

                {/* Logout */}
                <motion.button
                  onClick={async () => { await supabase.auth.signOut(); }}
                  className="p-3 sm:p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Log out"
                >
                  <LogOut size={20} />
                </motion.button>
              </div>
              
              {/* Add Water button - full width on mobile, auto on desktop */}
              <motion.button
                onClick={() => setShowingAddWater(true)}
                className="group bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:px-4 sm:py-2 rounded-lg font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus size={18} />
                </motion.div>
                Add Water
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-safe">
        {/* Progress Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Today's Progress
            </h2>
            <UnitSelectorCompact unit={unit} onUnitChange={setUnit} />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>{formatAmountWithUnit(todayTotalInUnit)}</span>
              <span>{formatAmountWithUnit(goalAmountInUnit)} goal</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              {Math.round(progressPercentage)}%
              {progressPercentage >= 100 && <Droplets className="text-green-600" size={24} />}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {progressPercentage >= 100 ? "Goal achieved!" : `${formatAmountWithUnit(remainingInUnit)} to go`}
            </div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Entries
            </h2>
            
            {/* Info Button */}
            <div className="relative" data-info-popup>
              <button
                onClick={() => setShowInfoPopup(!showInfoPopup)}
                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                title="What do the icons mean?"
              >
                <Info size={20} />
              </button>
              
              {/* Info Popup */}
              <AnimatePresence>
                {showInfoPopup && (
                  <motion.div 
                    className="absolute right-0 top-10 z-50 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Entry Sources</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Droplets size={16} className="text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-300">Manual entry</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-300">Reminder notification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone size={16} className="text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-300">Imported from app</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Watch size={16} className="text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-300">Wearable device</span>
                      </div>
                    </div>
                    
                    {/* Wearable Sync Button */}
                    <button
                      onClick={() => {
                        setShowInfoPopup(false);
                        setShowWearableSync(true);
                      }}
                      className="w-full mt-3 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Watch size={14} />
                      Sync Wearable Device
                    </button>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {entries.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <div className="mb-4 flex justify-center">
                <Droplets className="text-slate-300 dark:text-slate-600" size={48} />
              </div>
              <p>No water entries today yet.</p>
              <p className="text-sm">Tap "Add Water" to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {entries.map((entry, index) => (
                  <motion.div 
                    key={entry.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0,
                      transition: { duration: 0.4, ease: "easeIn" }
                    }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    layout
                  >
                    <WaterEntryCard 
                      entry={entry} 
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                      isRemoving={removingEntryId === entry.id.toString()}
                      unit={unit}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Add Water Modal */}
      <AnimatePresence>
        {showingAddWater && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md relative"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
            <button
              onClick={() => setShowingAddWater(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Add Water Entry
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount ({unit})
                </label>
                <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder={getQuickAmountsForUnit()[0].toString()}
                />

                <div className="flex gap-3 my-3">
                  {getQuickAmountsForUnit().map((amount, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setNewAmount(amount)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      whileHover={{ scale: 1.05, backgroundColor: "rgb(239 246 255)", borderColor: "rgb(147 197 253)" }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      {formatAmountWithUnit(amount)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g., After workout"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowingAddWater(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWater}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Add Entry
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Water Entry Modal */}
      <AnimatePresence>
        {editingEntry && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md relative"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
            <button
              onClick={handleCancelEdit}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Edit Water Entry
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount ({unit})
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder={getQuickAmountsForUnit()[0].toString()}
                />

                <div className="flex gap-3 my-3">
                  {getQuickAmountsForUnit().map((amount, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setEditAmount(amount)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      whileHover={{ scale: 1.05, backgroundColor: "rgb(239 246 255)", borderColor: "rgb(147 197 253)" }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      {formatAmountWithUnit(amount)}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g., After workout"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Manager */}
      <ProfileManager 
        isOpen={showProfileManager} 
        onClose={() => setShowProfileManager(false)} 
      />

      {/* Profile Setup Flow */}
      <ProfileSetup 
        isOpen={showProfileSetup} 
        onComplete={async () => {
          setShowProfileSetup(false);
          setProfileSetupCompleted(true);
          await refreshProfile();
        }} 
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
      />

      {/* Reminders Manager */}
      <RemindersManager 
        isOpen={showReminders} 
        onClose={() => setShowReminders(false)} 
      />

      {/* User Preferences */}
      <UserPreferences 
        isOpen={showPreferences} 
        onClose={() => setShowPreferences(false)} 
      />
      
      <SmartRecommendations 
        isOpen={showRecommendations} 
        onClose={() => setShowRecommendations(false)}
        onApplyGoal={() => {
          // Refresh the data after goal is updated
          loadData();
        }}
      />
      
      <DataImporter
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onImportComplete={() => {
          // Refresh the data after import is complete
          loadData();
        }}
      />
      
      <WearableSync
        isOpen={showWearableSync}
        onClose={() => setShowWearableSync(false)}
        onSyncComplete={() => {
          // Refresh the data after sync is complete
          loadData();
        }}
      />

      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        message={alertConfig.message}
        type={alertConfig.type}
        title={alertConfig.title}
      />
    </div>
  );
}