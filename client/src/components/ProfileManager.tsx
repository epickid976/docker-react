// 🎓 REACT CONCEPT: Profile management component
// In SwiftUI: struct ProfileManager: View { @StateObject private var profile = ProfileManager() }
// In React: <ProfileManager profile={profile} onUpdate={updateProfile} />

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Ruler, Weight, X, Save, Edit3 } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { MeasurementUnitSelector } from './MeasurementUnitSelector';
import { TimezonePicker } from './TimezonePicker';
import { convertHeight, convertWeight, formatHeight, formatWeight, HeightUnit, WeightUnit } from '../utils/unitConversions';

interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileManager({ isOpen, onClose }: ProfileManagerProps) {
  const { profile, updateProfile, loading, error } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    height_value: '',
    weight_value: '',
    height_unit: 'cm' as HeightUnit,
    weight_unit: 'kg' as WeightUnit,
    timezone: 'America/New_York',
  });

  // Initialize form data when profile loads
  useState(() => {
    if (profile) {
      const heightUnit = profile.height_unit || 'cm';
      const weightUnit = profile.weight_unit || 'kg';
      
      // Convert stored values to display units
      const heightValue = profile.height_cm 
        ? Math.round(convertHeight(profile.height_cm, 'cm', heightUnit) * 100) / 100
        : 0;
      const weightValue = profile.weight_kg 
        ? Math.round(convertWeight(profile.weight_kg, 'kg', weightUnit) * 100) / 100
        : 0;

      setFormData({
        display_name: profile.display_name || '',
        height_value: heightValue.toString(),
        weight_value: weightValue.toString(),
        height_unit: heightUnit,
        weight_unit: weightUnit,
        timezone: profile.timezone || 'America/New_York',
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Convert display values back to metric for storage
      const heightCm = formData.height_value 
        ? Math.round(convertHeight(parseFloat(formData.height_value), formData.height_unit, 'cm') * 100) / 100
        : undefined;
      const weightKg = formData.weight_value 
        ? Math.round(convertWeight(parseFloat(formData.weight_value), formData.weight_unit, 'kg') * 100) / 100
        : undefined;

      await updateProfile({
        display_name: formData.display_name || undefined,
        height_cm: heightCm,
        weight_kg: weightKg,
        height_unit: formData.height_unit,
        weight_unit: formData.weight_unit,
        timezone: formData.timezone,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleCancel = () => {
    if (profile) {
      const heightUnit = profile.height_unit || 'cm';
      const weightUnit = profile.weight_unit || 'kg';
      
      const heightValue = profile.height_cm 
        ? Math.round(convertHeight(profile.height_cm, 'cm', heightUnit) * 100) / 100
        : 0;
      const weightValue = profile.weight_kg 
        ? Math.round(convertWeight(profile.weight_kg, 'kg', weightUnit) * 100) / 100
        : 0;

      setFormData({
        display_name: profile.display_name || '',
        height_value: heightValue.toString(),
        weight_value: weightValue.toString(),
        height_unit: heightUnit,
        weight_unit: weightUnit,
        timezone: profile.timezone || 'America/New_York',
      });
    }
    setIsEditing(false);
  };


  if (loading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-xl p-8 w-full max-w-md text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <User className="text-blue-600" size={24} />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Profile Management
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <motion.button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit3 size={20} />
                  </motion.button>
                ) : (
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleSave}
                      className="p-2 text-green-600 hover:text-green-700 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save size={20} />
                    </motion.button>
                    <motion.button
                      onClick={handleCancel}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                )}
                <motion.button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            {error && (
              <motion.div
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {/* Profile Form */}
            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.display_name || ''}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your display name"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                    {profile?.display_name || 'Not set'}
                  </div>
                )}
              </div>

              {/* Height and Weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Ruler className="inline mr-2" size={16} />
                      Height
                    </label>
                    {isEditing && (
                      <MeasurementUnitSelector
                        type="height"
                        value={formData.height_unit}
                        onChange={(unit) => handleInputChange('height_unit', unit)}
                        className="text-xs"
                      />
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.height_value || ''}
                      onChange={(e) => handleInputChange('height_value', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formData.height_unit === 'ft' ? '5.5' : formData.height_unit === 'in' ? '66' : '170'}
                      min={formData.height_unit === 'ft' ? 3 : formData.height_unit === 'in' ? 36 : 50}
                      max={formData.height_unit === 'ft' ? 10 : formData.height_unit === 'in' ? 120 : 300}
                      step="0.1"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                      {profile?.height_cm ? formatHeight(convertHeight(profile.height_cm, 'cm', profile.height_unit || 'cm'), profile.height_unit || 'cm') : 'Not set'}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Weight className="inline mr-2" size={16} />
                      Weight
                    </label>
                    {isEditing && (
                      <MeasurementUnitSelector
                        type="weight"
                        value={formData.weight_unit}
                        onChange={(unit) => handleInputChange('weight_unit', unit)}
                        className="text-xs"
                      />
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.weight_value || ''}
                      onChange={(e) => handleInputChange('weight_value', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formData.weight_unit === 'lbs' ? '150' : '70'}
                      min={formData.weight_unit === 'lbs' ? 44 : 20}
                      max={formData.weight_unit === 'lbs' ? 1100 : 500}
                      step="0.1"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                      {profile?.weight_kg ? formatWeight(convertWeight(profile.weight_kg, 'kg', profile.weight_unit || 'kg'), profile.weight_unit || 'kg') : 'Not set'}
                    </div>
                  )}
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <MapPin className="inline mr-2" size={16} />
                  Timezone
                </label>
                {isEditing ? (
                  <TimezonePicker
                    value={formData.timezone}
                    onChange={(timezone) => handleInputChange('timezone', timezone)}
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                    {profile?.timezone?.replace('_', ' ') || 'Not set'}
                  </div>
                )}
              </div>

              {/* Profile Completion Status */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Profile Completion
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${profile ? Math.round(((profile.display_name ? 1 : 0) + (profile.height_cm ? 1 : 0) + (profile.weight_kg ? 1 : 0)) / 3 * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {profile ? Math.round(((profile.display_name ? 1 : 0) + (profile.height_cm ? 1 : 0) + (profile.weight_kg ? 1 : 0)) / 3 * 100) : 0}%
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Complete your profile to get personalized recommendations
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
