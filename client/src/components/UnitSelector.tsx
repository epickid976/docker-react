import { motion } from 'framer-motion';
import { MeasureUnit } from '../utils/unitConversions';

interface UnitSelectorProps {
  unit: MeasureUnit;
  setUnit: (unit: MeasureUnit) => void;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({ unit, setUnit }) => {
  const units: MeasureUnit[] = ['ml', 'oz', 'cup', 'bottle'];

  return (
    <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
      {units.map((u) => (
        <motion.button
          key={u}
          onClick={() => setUnit(u)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            unit === u
              ? 'bg-blue-500 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {u}
        </motion.button>
      ))}
    </div>
  );
};

export const UnitSelectorCompact: React.FC<UnitSelectorProps> = ({ unit, setUnit }) => {
  const units: MeasureUnit[] = ['ml', 'oz', 'cup', 'bottle'];

  return (
    <select
      value={unit}
      onChange={(e) => setUnit(e.target.value as MeasureUnit)}
      className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none text-sm"
    >
      {units.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  );
};

