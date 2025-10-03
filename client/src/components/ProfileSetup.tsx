// 🎓 REACT CONCEPT: Profile setup flow for new users
// In SwiftUI: struct ProfileSetup: View { @State private var currentStep = 0 }
// In React: <ProfileSetup isOpen={showSetup} onComplete={handleComplete} />

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Ruler, Weight, MapPin, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { MeasurementUnitSelector } from './MeasurementUnitSelector';
import { TimezonePicker } from './TimezonePicker';
import { convertHeight, convertWeight, HeightUnit, WeightUnit } from '../utils/unitConversions';
import CustomAlert from './CustomAlert';

interface ProfileSetupProps {
  isOpen: boolean;
  onComplete: () => void;
}

const steps = [
  { id: 'welcome', title: 'Welcome to GoutDeau!', icon: User },
  { id: 'display_name', title: 'What should we call you?', icon: User },
  { id: 'measurements', title: 'Your measurements', icon: Ruler },
  { id: 'timezone', title: 'Your timezone', icon: MapPin },
  { id: 'complete', title: 'All set!', icon: CheckCircle },
];

export function ProfileSetup({ isOpen, onComplete }: ProfileSetupProps) {
  const { profile, updateProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(0);
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
  const [formData, setFormData] = useState({
    display_name: '',
    height_value: '',
    weight_value: '',
    height_unit: 'cm' as HeightUnit,
    weight_unit: 'kg' as WeightUnit,
    timezone: 'America/New_York',
  });
  const [loading, setLoading] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
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
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentStep < 4) { // Not on the last step
        handleNext();
      } else {
        handleComplete();
      }
    }
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Complete setup
      await handleComplete();
      return;
    }

    if (currentStep === 1 && !formData.display_name.trim()) {
      setAlertConfig({
        isOpen: true,
        message: 'Please enter your display name',
        type: 'warning'
      });
      return;
    }

    if (currentStep === 2 && (!formData.height_value || !formData.weight_value)) {
      setAlertConfig({
        isOpen: true,
        message: 'Please enter both height and weight',
        type: 'warning'
      });
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
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
      
      // Small delay to ensure the profile is updated before closing
      await new Promise(resolve => setTimeout(resolve, 100));
      onComplete();
    } catch (error) {
      console.error('Error completing profile setup:', error);
      setAlertConfig({
        isOpen: true,
        message: 'Failed to save profile. Please try again.',
        type: 'error',
        title: 'Error'
      });
    } finally {
      setLoading(false);
    }
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto"
            >
              <User className="text-blue-600 dark:text-blue-400" size={40} />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome to GoutDeau!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Let's set up your profile to personalize your water tracking experience.
            </p>
          </div>
        );

      case 1: // Display Name
        return (
          <div className="space-y-4">
            <div className="text-center">
              <User className="text-blue-600 dark:text-blue-400 mx-auto mb-4" size={48} />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                What should we call you?
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                This will be displayed throughout the app
              </p>
            </div>
            <input
              type="text"
              value={formData.display_name || ''}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              autoFocus
            />
          </div>
        );

      case 2: // Measurements
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Ruler className="text-blue-600 dark:text-blue-400 mx-auto mb-4" size={48} />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Your measurements
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                This helps us provide personalized recommendations
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Height
                  </label>
                  <MeasurementUnitSelector
                    type="height"
                    value={formData.height_unit}
                    onChange={(unit) => handleInputChange('height_unit', unit)}
                    className="text-xs"
                  />
                </div>
                <input
                  type="number"
                  value={formData.height_value || ''}
                  onChange={(e) => handleInputChange('height_value', e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={formData.height_unit === 'ft' ? '5.5' : formData.height_unit === 'in' ? '66' : '170'}
                  min={formData.height_unit === 'ft' ? 3 : formData.height_unit === 'in' ? 36 : 50}
                  max={formData.height_unit === 'ft' ? 10 : formData.height_unit === 'in' ? 120 : 300}
                  step="0.1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Weight
                  </label>
                  <MeasurementUnitSelector
                    type="weight"
                    value={formData.weight_unit}
                    onChange={(unit) => handleInputChange('weight_unit', unit)}
                    className="text-xs"
                  />
                </div>
                <input
                  type="number"
                  value={formData.weight_value || ''}
                  onChange={(e) => handleInputChange('weight_value', e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={formData.weight_unit === 'lbs' ? '150' : '70'}
                  min={formData.weight_unit === 'lbs' ? 44 : 20}
                  max={formData.weight_unit === 'lbs' ? 1100 : 500}
                  step="0.1"
                />
              </div>
            </div>
          </div>
        );

      case 3: // Timezone
        return (
          <div className="space-y-4">
            <div className="text-center">
              <MapPin className="text-blue-600 dark:text-blue-400 mx-auto mb-4" size={48} />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Your timezone
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                This ensures accurate daily tracking
              </p>
            </div>
            <TimezonePicker
              value={formData.timezone}
              onChange={(timezone) => handleInputChange('timezone', timezone)}
              onKeyPress={handleKeyPress}
            />
          </div>
        );

      case 4: // Complete
        return (
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              All set!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Your profile is complete. Let's start tracking your hydration!
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl p-8 w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <motion.button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white transition-colors"
              whileHover={{ scale: currentStep > 0 ? 1.05 : 1 }}
              whileTap={{ scale: currentStep > 0 ? 0.95 : 1 }}
            >
              <ArrowLeft size={16} />
              Previous
            </motion.button>

            <motion.button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <span className="text-xs opacity-75 ml-1">(or press Enter)</span>
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                  <span className="text-xs opacity-75 ml-1">(or press Enter)</span>
                </>
              )}
            </motion.button>
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
