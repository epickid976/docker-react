import { useState, useEffect } from 'react';
import { MeasureUnit, convertAmount } from '../utils/unitConversions';
import { useAuth } from '../auth/AuthContext';

export const useUnitPreferences = () => {
  const { profile } = useAuth();
  const [unit, setUnit] = useState<MeasureUnit>('ml');

  useEffect(() => {
    // In the future, this could load from profile preferences
    // For now, just use ml as default
    setUnit('ml');
  }, [profile]);

  // Convert from ml to current unit
  const convertFromMl = (ml: number): number => {
    return convertAmount(ml, 'ml', unit);
  };

  // Convert from current unit to ml
  const convertToMl = (amount: number): number => {
    return convertAmount(amount, unit, 'ml');
  };

  // Format amount with unit
  const formatAmountWithUnit = (amount: number): string => {
    return `${Math.round(amount)} ${unit}`;
  };

  // Get quick amount buttons based on unit
  const getQuickAmountsForUnit = (): number[] => {
    const quickAmounts: Record<MeasureUnit, number[]> = {
      ml: [100, 250, 500, 750, 1000],
      oz: [4, 8, 12, 16, 24],
      cup: [0.5, 1, 1.5, 2, 3],
      bottle: [0.5, 1, 1.5, 2, 3],
    };
    return quickAmounts[unit];
  };

  // Get recommended daily goal for current unit
  const getRecommendedGoalForUnit = (): number => {
    return convertFromMl(2500); // 2500ml is the default recommendation
  };

  return { 
    unit, 
    setUnit,
    convertFromMl,
    convertToMl,
    formatAmountWithUnit,
    getQuickAmountsForUnit,
    getRecommendedGoalForUnit
  };
};

