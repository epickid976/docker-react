import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, TrendingUp, Lightbulb, Activity, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabaseClient';
import {
  calculateRecommendedGoalMl,
  analyzeGoalAdjustment,
  getPersonalizedSuggestions,
  getGoalAdjustmentRecommendations
} from '../utils/goalRecommendations';
import { useUnitPreferences } from '../hooks/useUnitPreferences';
import { convertAmount } from '../utils/unitConversions';
import CustomAlert from './CustomAlert';

interface SmartRecommendationsProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGoal?: (newGoalMl: number) => void;
}

interface AnalyticsData {
  average_intake_ml: number;
  current_goal_ml: number;
  achievement_rate: number;
  days_tracked: number;
}

export default function SmartRecommendations({ isOpen, onClose, onApplyGoal }: SmartRecommendationsProps) {
  const { user, profile } = useAuth();
  const { unit, convertFromMl } = useUnitPreferences();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [customGoal, setCustomGoal] = useState<string>('');
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

  useEffect(() => {
    if (isOpen && user && profile) {
      loadAnalytics();
    }
  }, [isOpen, user, profile]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get last 30 days of water entries
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: entries, error: entriesError } = await supabase
        .from('water_entries')
        .select('amount_ml, date')
        .eq('user_id', user?.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (entriesError) throw entriesError;

      // Calculate daily totals
      const dailyTotals = new Map<string, number>();
      entries?.forEach(entry => {
        const date = entry.date;
        dailyTotals.set(date, (dailyTotals.get(date) || 0) + entry.amount_ml);
      });

      const days_tracked = dailyTotals.size;
      const total_intake = Array.from(dailyTotals.values()).reduce((sum, val) => sum + val, 0);
      const average_intake_ml = days_tracked > 0 ? total_intake / days_tracked : 0;

      // Get current goal
      const today = new Date().toISOString().split('T')[0];
      const { data: goalData } = await supabase
        .from('daily_goals')
        .select('goal_ml')
        .eq('user_id', user?.id)
        .eq('date', today)
        .single();

      const current_goal_ml = goalData?.goal_ml || 2500;
      const achievement_rate = current_goal_ml > 0 ? average_intake_ml / current_goal_ml : 0;

      setAnalytics({
        average_intake_ml,
        current_goal_ml,
        achievement_rate,
        days_tracked
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async (newGoalMl: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_goals')
        .upsert({
          user_id: user?.id,
          date: today,
          goal_ml: newGoalMl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      setAlertConfig({
        isOpen: true,
        message: `Goal updated to ${Math.round(convertFromMl(newGoalMl))} ${unit}!`,
        type: 'success',
        title: 'Success'
      });

      if (onApplyGoal) {
        onApplyGoal(newGoalMl);
      }

      // Reload analytics
      setTimeout(() => loadAnalytics(), 500);
    } catch (error: any) {
      console.error('Error applying goal:', error);
      setAlertConfig({
        isOpen: true,
        message: `Failed to update goal: ${error.message}`,
        type: 'error',
        title: 'Error'
      });
    }
  };

  if (!isOpen) return null;

  // Check if profile is complete
  if (!profile?.height_cm || !profile?.weight_kg) {
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <AlertCircle size={48} className="text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Complete Your Profile
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                To get personalized recommendations, please complete your profile with your height and weight.
              </p>
              <motion.button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const recommendation = calculateRecommendedGoalMl(
    profile.weight_kg,
    profile.height_cm,
    selectedActivityLevel
  );

  const adjustment = analytics ? analyzeGoalAdjustment(
    analytics.current_goal_ml,
    profile.weight_kg,
    profile.height_cm,
    analytics.average_intake_ml,
    selectedActivityLevel
  ) : null;

  const goalAdjustment = analytics ? getGoalAdjustmentRecommendations(
    analytics.current_goal_ml,
    analytics.average_intake_ml,
    analytics.achievement_rate,
    analytics.days_tracked
  ) : null;

  const suggestions = getPersonalizedSuggestions(
    profile.weight_kg,
    profile.height_cm,
    analytics?.average_intake_ml || 0,
    analytics?.current_goal_ml || 2500
  );

  const activityLevels = [
    { value: 'sedentary' as const, label: 'Sedentary', desc: 'Little to no exercise' },
    { value: 'light' as const, label: 'Light', desc: '1-3 days/week' },
    { value: 'moderate' as const, label: 'Moderate', desc: '3-5 days/week' },
    { value: 'active' as const, label: 'Active', desc: '6-7 days/week' },
    { value: 'very_active' as const, label: 'Very Active', desc: 'Physical job + exercise' }
  ];

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
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lightbulb size={28} />
              Smart Goal Recommendations
            </h2>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} className="text-white" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 dark:text-slate-400 mt-4">Analyzing your data...</p>
              </div>
            ) : (
              <>
                {/* Activity Level Selector */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Activity size={20} className="text-green-500" />
                    Your Activity Level
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {activityLevels.map((level) => (
                      <motion.button
                        key={level.value}
                        onClick={() => setSelectedActivityLevel(level.value)}
                        className={`
                          p-3 rounded-lg border-2 transition-all text-left
                          ${selectedActivityLevel === level.value
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {level.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {level.desc}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Recommended Goal */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Target size={24} className="text-blue-600" />
                        Recommended Daily Goal
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{recommendation.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {Math.round(convertFromMl(recommendation.recommended_ml))}
                      </div>
                      <div className="text-sm text-slate-500">{unit}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {recommendation.factors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                        {factor}
                      </div>
                    ))}
                  </div>

                  <motion.button
                    onClick={() => handleApplyRecommendation(recommendation.recommended_ml)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Apply This Goal
                  </motion.button>
                </div>

                {/* Goal Analysis */}
                {adjustment && analytics && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <TrendingUp size={20} className="text-purple-600" />
                      Goal Analysis
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Current Goal</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {Math.round(convertFromMl(adjustment.current_goal_ml))} {unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Average Intake</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {Math.round(convertFromMl(analytics.average_intake_ml))} {unit}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                      <p className="text-slate-700 dark:text-slate-300">{adjustment.suggestion}</p>
                      {adjustment.reasons.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {adjustment.reasons.map((reason, index) => (
                            <div key={index} className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              • {reason}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {goalAdjustment?.should_adjust && (
                      <motion.button
                        onClick={() => handleApplyRecommendation(goalAdjustment.new_goal_ml)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Apply Recommended Adjustment ({Math.round(convertFromMl(goalAdjustment.new_goal_ml))} {unit})
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Custom Goal Input */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Edit3 size={20} className="text-indigo-600" />
                    Set Custom Goal
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Have a specific goal in mind? Enter your own daily water intake target.
                  </p>
                  
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        placeholder={`Enter amount in ${unit}`}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
                      />
                    </div>
                    <motion.button
                      onClick={() => {
                        const goalValue = parseFloat(customGoal);
                        if (isNaN(goalValue) || goalValue <= 0) {
                          setAlertConfig({
                            isOpen: true,
                            message: 'Please enter a valid positive number',
                            type: 'warning',
                            title: 'Invalid Input'
                          });
                          return;
                        }
                        
                        // Convert from current unit to ml
                        const goalInMl = Math.round(convertAmount(goalValue, unit, 'ml'));
                        handleApplyRecommendation(goalInMl);
                        setCustomGoal(''); // Clear input after applying
                      }}
                      disabled={!customGoal}
                      className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                        customGoal
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                      whileHover={customGoal ? { scale: 1.02 } : {}}
                      whileTap={customGoal ? { scale: 0.98 } : {}}
                    >
                      Apply Custom Goal
                    </motion.button>
                  </div>
                  
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    💡 Tip: Most adults need 2000-3000ml (68-102oz) of water per day
                  </div>
                </div>

                {/* Personalized Suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Lightbulb size={20} className="text-yellow-500" />
                      Personalized Suggestions
                    </h3>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800"
                        >
                          <p className="text-slate-700 dark:text-slate-300">{suggestion}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
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

