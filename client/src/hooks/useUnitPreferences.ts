import { useState, useEffect } from 'react';
import { MeasureUnit } from '../utils/unitConversions';
import { useAuth } from '../auth/AuthContext';

export const useUnitPreferences = () => {
  const { profile } = useAuth();
  const [unit, setUnit] = useState<MeasureUnit>('ml');

  useEffect(() => {
    // In the future, this could load from profile preferences
    // For now, just use ml as default
    setUnit('ml');
  }, [profile]);

  return { unit, setUnit };
};

