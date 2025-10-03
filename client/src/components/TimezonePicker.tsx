// 🎓 REACT CONCEPT: Custom timezone picker component
// In SwiftUI: Picker("Timezone", selection: $timezone) { ... }
// In React: <TimezonePicker value={timezone} onChange={setTimezone} />

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Search } from 'lucide-react';

interface TimezonePickerProps {
  value: string;
  onChange: (timezone: string) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  className?: string;
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', region: 'US East' },
  { value: 'America/Chicago', label: 'Central Time (CT)', region: 'US Central' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', region: 'US Mountain' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', region: 'US West' },
  { value: 'America/Toronto', label: 'Eastern Time (ET)', region: 'Canada East' },
  { value: 'America/Vancouver', label: 'Pacific Time (PT)', region: 'Canada West' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', region: 'UK' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Central European Time (CET)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Central European Time (CET)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Central European Time (CET)', region: 'Europe' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time (HKT)', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)', region: 'Asia' },
  { value: 'Asia/Mumbai', label: 'India Standard Time (IST)', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', region: 'Middle East' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', region: 'Australia' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time (AET)', region: 'Australia' },
  { value: 'Australia/Perth', label: 'Australian Western Time (AWT)', region: 'Australia' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)', region: 'Pacific' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT)', region: 'South America' },
  { value: 'America/Mexico_City', label: 'Central Time (CT)', region: 'Mexico' },
  { value: 'Africa/Cairo', label: 'Eastern European Time (EET)', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'South Africa Time (SAST)', region: 'Africa' },
];

export function TimezonePicker({ value, onChange, onKeyPress, className = '' }: TimezonePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTimezone = timezones.find(tz => tz.value === value);
  
  const filteredTimezones = timezones.filter(tz => 
    tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (timezone: string) => {
    onChange(timezone);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onKeyPress={onKeyPress}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        whileHover={{ backgroundColor: 'rgb(248 250 252)' }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-slate-500" />
          <span className="text-sm">
            {selectedTimezone ? selectedTimezone.label : 'Select timezone'}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-slate-500" />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-80 overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search timezones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Timezone List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredTimezones.length > 0 ? (
                filteredTimezones.map((timezone) => (
                  <motion.button
                    key={timezone.value}
                    onClick={() => handleSelect(timezone.value)}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 ${
                      value === timezone.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                    }`}
                    whileHover={{ backgroundColor: 'rgb(248 250 252)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{timezone.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{timezone.region}</span>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No timezones found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function TimezonePickerCompact({ value, onChange, onKeyPress, className = '' }: TimezonePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTimezone = timezones.find(tz => tz.value === value);
  
  const filteredTimezones = timezones.filter(tz => 
    tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (timezone: string) => {
    onChange(timezone);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onKeyPress={onKeyPress}
        className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        whileHover={{ backgroundColor: 'rgb(248 250 252)' }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-slate-500" />
          <span className="truncate">
            {selectedTimezone ? selectedTimezone.label.split(' ')[0] : 'Select timezone'}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-slate-500" />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Timezone List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredTimezones.length > 0 ? (
                filteredTimezones.map((timezone) => (
                  <motion.button
                    key={timezone.value}
                    onClick={() => handleSelect(timezone.value)}
                    className={`w-full px-2 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 ${
                      value === timezone.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                    }`}
                    whileHover={{ backgroundColor: 'rgb(248 250 252)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium truncate">{timezone.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{timezone.region}</span>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="px-2 py-2 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No timezones found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </div>
  );
}
