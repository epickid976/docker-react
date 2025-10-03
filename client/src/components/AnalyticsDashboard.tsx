import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Target, 
  Droplets, 
  X,
  Activity,
  Zap
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useUnitPreferences } from '../hooks/useUnitPreferences';

// 🎓 REACT CONCEPT: TypeScript interfaces for data structures
// Like Swift structs, these define the shape of our data
interface WaterEntry {
  id: number;
  amount_ml: number;
  entry_ts: string;
  source: 'manual' | 'reminder' | 'import' | 'wearable';
  note?: string;
}


interface AnalyticsData {
  dailyEntries: { [date: string]: WaterEntry[] };
  weeklyTotals: { [week: string]: number };
  monthlyTotals: { [month: string]: number };
  averageDailyIntake: number;
  goalAchievementRate: number;
  streakDays: number;
  bestDay: { date: string; amount: number };
  trends: {
    weekly: number[];
    monthly: number[];
  };
}

// 🎓 REACT CONCEPT: Props interface - like SwiftUI's @Binding
interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// 🎓 REACT CONCEPT: Custom hook for data fetching
// Similar to SwiftUI's @StateObject or @ObservedObject
function useAnalyticsData() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get water entries from the last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: entries, error: entriesError } = await supabase
        .from('hydration_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_ts', ninetyDaysAgo.toISOString())
        .order('entry_ts', { ascending: true });

      if (entriesError) throw entriesError;

      // Get daily goals (optional - table might not exist yet)
      let goals: any[] = [];
      try {
        const { data: goalsData, error: goalsError } = await supabase
          .from('daily_goals')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (goalsError) {
          console.warn('Daily goals table not available:', goalsError);
          goals = [];
        } else {
          goals = goalsData || [];
        }
      } catch (err) {
        console.warn('Could not load daily goals:', err);
        goals = [];
      }

      // Process the data
      const processedData = processAnalyticsData(entries || [], goals || []);
      setData(processedData);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: loadAnalyticsData };
}

// 🎓 REACT CONCEPT: Pure function for data processing
// Like SwiftUI's computed properties or helper functions
function processAnalyticsData(entries: WaterEntry[], goals: any[]): AnalyticsData {
  const dailyEntries: { [date: string]: WaterEntry[] } = {};
  const weeklyTotals: { [week: string]: number } = {};
  const monthlyTotals: { [month: string]: number } = {};
  
  let totalIntake = 0;
  let daysWithEntries = 0;
  let goalAchievedDays = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let bestDay = { date: '', amount: 0 };

  // Group entries by date
  entries.forEach(entry => {
    const date = entry.entry_ts.split('T')[0];
    if (!dailyEntries[date]) {
      dailyEntries[date] = [];
    }
    dailyEntries[date].push(entry);
  });

  // Calculate daily totals and statistics
  Object.entries(dailyEntries).forEach(([date, dayEntries]) => {
    const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.amount_ml, 0);
    totalIntake += dayTotal;
    daysWithEntries++;

    // Update best day
    if (dayTotal > bestDay.amount) {
      bestDay = { date, amount: dayTotal };
    }

    // Calculate weekly totals
    const weekStart = getWeekStart(date);
    if (!weeklyTotals[weekStart]) {
      weeklyTotals[weekStart] = 0;
    }
    weeklyTotals[weekStart] += dayTotal;

    // Calculate monthly totals
    const month = date.substring(0, 7); // YYYY-MM
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = 0;
    }
    monthlyTotals[month] += dayTotal;

    // Check goal achievement (use default goal if no specific goal set)
    const dayGoal = goals.find(g => g.date === date);
    const goalForDay = dayGoal ? dayGoal.goal_ml : 2500; // Default 2500ml if no goal set
    
    if (dayTotal >= goalForDay) {
      goalAchievedDays++;
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  // Calculate trends
  const weeklyTrend = Object.values(weeklyTotals).slice(-8); // Last 8 weeks
  const monthlyTrend = Object.values(monthlyTotals).slice(-6); // Last 6 months

  return {
    dailyEntries,
    weeklyTotals,
    monthlyTotals,
    averageDailyIntake: daysWithEntries > 0 ? totalIntake / daysWithEntries : 0,
    goalAchievementRate: daysWithEntries > 0 ? (goalAchievedDays / daysWithEntries) * 100 : 0,
    streakDays: maxStreak,
    bestDay,
    trends: {
      weekly: weeklyTrend,
      monthly: monthlyTrend
    }
  };
}

// Helper function to get week start (Monday)
function getWeekStart(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// 🎓 REACT CONCEPT: Main component - like SwiftUI's View
export default function AnalyticsDashboard({ isOpen, onClose }: AnalyticsDashboardProps) {
  const { data, loading, error, refetch } = useAnalyticsData();
  const { convertFromMl: convertFromMlNumber, unit } = useUnitPreferences();
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'monthly' | 'trends'>('overview');

  // Convert from ml to current unit with value and unit object
  const convertFromMl = (ml: number) => ({
    value: convertFromMlNumber(ml),
    unit: unit
  });

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
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Analytics & Insights
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Track your hydration progress and trends
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : data ? (
              <AnalyticsContent data={data} activeTab={activeTab} onTabChange={setActiveTab} convertFromMl={convertFromMl} />
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// 🎓 REACT CONCEPT: Child component with props
// Like SwiftUI's View that takes parameters
interface AnalyticsContentProps {
  data: AnalyticsData;
  activeTab: 'overview' | 'weekly' | 'monthly' | 'trends';
  onTabChange: (tab: 'overview' | 'weekly' | 'monthly' | 'trends') => void;
  convertFromMl: (ml: number) => { value: number; unit: string };
}

function AnalyticsContent({ data, activeTab, onTabChange, convertFromMl }: AnalyticsContentProps) {
  const tabs: Array<{ id: 'overview' | 'weekly' | 'monthly' | 'trends'; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'weekly', label: 'Weekly View', icon: Calendar },
    { id: 'monthly', label: 'Monthly View', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab data={data} convertFromMl={convertFromMl} />}
          {activeTab === 'weekly' && <WeeklyTab data={data} convertFromMl={convertFromMl} />}
          {activeTab === 'monthly' && <MonthlyTab data={data} convertFromMl={convertFromMl} />}
          {activeTab === 'trends' && <TrendsTab data={data} convertFromMl={convertFromMl} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// 🎓 REACT CONCEPT: Individual tab components
// Like SwiftUI's separate View structs for different screens
function OverviewTab({ data, convertFromMl }: { data: AnalyticsData; convertFromMl: (ml: number) => { value: number; unit: string } }) {
  const stats = [
    {
      title: 'Average Daily Intake',
      value: convertFromMl(data.averageDailyIntake),
      icon: Droplets,
      color: 'blue'
    },
    {
      title: 'Goal Achievement Rate',
      value: { value: data.goalAchievementRate, unit: '%' },
      icon: Target,
      color: 'green'
    },
    {
      title: 'Best Streak',
      value: { value: data.streakDays, unit: ' days' },
      icon: Zap,
      color: 'purple'
    },
    {
      title: 'Best Day',
      value: convertFromMl(data.bestDay.amount),
      icon: Activity,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-900/20 dark:to-${stat.color}-800/20 p-6 rounded-xl border border-${stat.color}-200 dark:border-${stat.color}-700`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                <div className={`w-3 h-3 rounded-full bg-${stat.color}-500`}></div>
              </div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value.value.toFixed(1)}{stat.value.unit}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {Object.entries(data.dailyEntries)
            .slice(-7)
            .reverse()
            .map(([date, entries]) => {
              const total = entries.reduce((sum, entry) => sum + entry.amount_ml, 0);
              const converted = convertFromMl(total);
              return (
                <div key={date} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-600 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {converted.value.toFixed(1)} {converted.unit}
                    </span>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {entries.length} entries
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function WeeklyTab({ data, convertFromMl }: { data: AnalyticsData; convertFromMl: (ml: number) => { value: number; unit: string } }) {
  const weeks = Object.entries(data.weeklyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8); // Last 8 weeks

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Weekly Intake Overview
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {weeks.map(([weekStart, total]) => {
          const converted = convertFromMl(total);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          return (
            <motion.div
              key={weekStart}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600"
            >
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {converted.value.toFixed(1)} {converted.unit}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {Object.keys(data.dailyEntries).filter(date => {
                  const d = new Date(date);
                  const start = new Date(weekStart);
                  const end = new Date(weekStart);
                  end.setDate(end.getDate() + 6);
                  return d >= start && d <= end;
                }).length} days active
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MonthlyTab({ data, convertFromMl }: { data: AnalyticsData; convertFromMl: (ml: number) => { value: number; unit: string } }) {
  const months = Object.entries(data.monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6); // Last 6 months

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Monthly Intake Overview
      </h3>
      
      <div className="space-y-4">
        {months.map(([month, total]) => {
          const converted = convertFromMl(total);
          const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          
          return (
            <motion.div
              key={month}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {monthName}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {Object.keys(data.dailyEntries).filter(date => date.startsWith(month)).length} days active
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {converted.value.toFixed(1)} {converted.unit}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Daily avg: {convertFromMl(total / 30).value.toFixed(1)} {convertFromMl(total / 30).unit}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TrendsTab({ data, convertFromMl }: { data: AnalyticsData; convertFromMl: (ml: number) => { value: number; unit: string } }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Progress Trends
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-white dark:bg-slate-700 p-6 rounded-lg border border-slate-200 dark:border-slate-600">
          <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">
            Weekly Trend (Last 8 Weeks)
          </h4>
          <div className="space-y-2">
            {data.trends.weekly.map((value, index) => {
              const converted = convertFromMl(value);
              const maxValue = Math.max(...data.trends.weekly);
              const percentage = (value / maxValue) * 100;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400 w-16">
                    Week {index + 1}
                  </div>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white w-20 text-right">
                    {converted.value.toFixed(1)} {converted.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white dark:bg-slate-700 p-6 rounded-lg border border-slate-200 dark:border-slate-600">
          <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">
            Monthly Trend (Last 6 Months)
          </h4>
          <div className="space-y-2">
            {data.trends.monthly.map((value, index) => {
              const converted = convertFromMl(value);
              const maxValue = Math.max(...data.trends.monthly);
              const percentage = (value / maxValue) * 100;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400 w-16">
                    Month {index + 1}
                  </div>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white w-20 text-right">
                    {converted.value.toFixed(1)} {converted.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
