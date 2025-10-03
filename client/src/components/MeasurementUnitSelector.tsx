// 🎓 REACT CONCEPT: Measurement unit selector component
// In SwiftUI: Picker("Height Unit", selection: $heightUnit) { ... }
// In React: <MeasurementUnitSelector type="height" value={heightUnit} onChange={setHeightUnit} />

import { motion } from 'framer-motion';
import { Ruler, Weight } from 'lucide-react';
import { HeightUnit, WeightUnit, formatHeight, formatWeight } from '../utils/unitConversions';

interface MeasurementUnitSelectorProps {
  type: 'height' | 'weight';
  value: HeightUnit | WeightUnit;
  onChange: (unit: HeightUnit | WeightUnit) => void;
  className?: string;
}

export function MeasurementUnitSelector({ type, value, onChange, className = '' }: MeasurementUnitSelectorProps) {
  const heightUnits: HeightUnit[] = ['cm', 'ft', 'in'];
  const weightUnits: WeightUnit[] = ['kg', 'lbs'];
  
  const units = type === 'height' ? heightUnits : weightUnits;
  const Icon = type === 'height' ? Ruler : Weight;

  const getDisplayName = (unit: string) => {
    const names: Record<string, string> = {
      cm: 'Centimeters',
      ft: 'Feet',
      in: 'Inches',
      kg: 'Kilograms',
      lbs: 'Pounds',
    };
    return names[unit] || unit;
  };

  const getShortName = (unit: string) => {
    const names: Record<string, string> = {
      cm: 'cm',
      ft: 'ft',
      in: 'in',
      kg: 'kg',
      lbs: 'lbs',
    };
    return names[unit] || unit;
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as HeightUnit | WeightUnit)}
        className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      >
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {getDisplayName(unit)} ({getShortName(unit)})
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <motion.div
          animate={{ rotate: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icon size={16} className="text-slate-400" />
        </motion.div>
      </div>
    </div>
  );
}

// Compact version for inline use
export function MeasurementUnitSelectorCompact({ type, value, onChange, className = '' }: MeasurementUnitSelectorProps) {
  const heightUnits: HeightUnit[] = ['cm', 'ft', 'in'];
  const weightUnits: WeightUnit[] = ['kg', 'lbs'];
  
  const units = type === 'height' ? heightUnits : weightUnits;

  const getShortName = (unit: string) => {
    const names: Record<string, string> = {
      cm: 'cm',
      ft: 'ft',
      in: 'in',
      kg: 'kg',
      lbs: 'lbs',
    };
    return names[unit] || unit;
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as HeightUnit | WeightUnit)}
        className="appearance-none bg-transparent border-none text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none cursor-pointer transition-colors duration-200"
      >
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {getShortName(unit).toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
