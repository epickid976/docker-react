import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Watch, X, Check, AlertCircle, Smartphone, Activity, Loader, Zap } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/AuthContext';

interface WearableSyncProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

type DeviceType = 'apple_watch' | 'fitbit' | 'garmin' | 'samsung';

interface WearableDevice {
  id: DeviceType;
  name: string;
  icon: 'watch' | 'phone' | 'activity';
  color: string;
  hoverColor: string;
}

const devices: WearableDevice[] = [
  { id: 'apple_watch', name: 'Apple Watch', icon: 'watch', color: 'text-slate-600', hoverColor: 'hover:text-slate-800' },
  { id: 'fitbit', name: 'Fitbit', icon: 'activity', color: 'text-cyan-600', hoverColor: 'hover:text-cyan-700' },
  { id: 'garmin', name: 'Garmin', icon: 'watch', color: 'text-blue-600', hoverColor: 'hover:text-blue-700' },
  { id: 'samsung', name: 'Samsung Health', icon: 'phone', color: 'text-indigo-600', hoverColor: 'hover:text-indigo-700' },
];

export default function WearableSync({ isOpen, onClose, onSyncComplete }: WearableSyncProps) {
  const { user } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; entriesAdded: number } | null>(null);

  const handleSync = async (deviceId: DeviceType) => {
    if (!user) return;
    
    setSelectedDevice(deviceId);
    setSyncing(true);
    setSyncResult(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock wearable data for the last 7 days
      const mockEntries = generateMockWearableData(deviceId);
      
      // Insert mock entries into database
      let successCount = 0;
      for (const entry of mockEntries) {
        const { error } = await supabase
          .from('hydration_entries')
          .insert([{
            user_id: user.id,
            amount_ml: entry.amount_ml,
            source: 'wearable',
            note: `Synced from ${devices.find(d => d.id === deviceId)?.name}`,
            entry_ts: entry.timestamp
          }]);

        if (!error) successCount++;
      }

      setSyncResult({ success: true, entriesAdded: successCount });
      onSyncComplete();
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({ success: false, entriesAdded: 0 });
    } finally {
      setSyncing(false);
    }
  };

  const generateMockWearableData = (deviceId: DeviceType): Array<{ amount_ml: number; timestamp: string }> => {
    const entries: Array<{ amount_ml: number; timestamp: string }> = [];
    const now = new Date();
    
    // Generate 3-5 entries per day for the last 3 days
    for (let day = 0; day < 3; day++) {
      const entriesPerDay = Math.floor(Math.random() * 3) + 3; // 3-5 entries
      
      for (let i = 0; i < entriesPerDay; i++) {
        const entryDate = new Date(now);
        entryDate.setDate(entryDate.getDate() - day);
        entryDate.setHours(8 + i * 3, Math.floor(Math.random() * 60), 0, 0);
        
        // Different devices track water in different amounts
        let amount_ml = 250;
        switch (deviceId) {
          case 'apple_watch':
            amount_ml = [237, 355, 473][Math.floor(Math.random() * 3)]; // 8oz, 12oz, 16oz
            break;
          case 'fitbit':
            amount_ml = [240, 360, 480][Math.floor(Math.random() * 3)];
            break;
          case 'garmin':
            amount_ml = [250, 500, 750][Math.floor(Math.random() * 3)];
            break;
          case 'samsung':
            amount_ml = [200, 300, 400][Math.floor(Math.random() * 3)];
            break;
        }
        
        entries.push({
          amount_ml,
          timestamp: entryDate.toISOString()
        });
      }
    }
    
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleClose = () => {
    setSyncResult(null);
    setSelectedDevice(null);
    onClose();
  };

  const getDeviceIcon = (iconType: string) => {
    switch (iconType) {
      case 'watch': return Watch;
      case 'phone': return Smartphone;
      case 'activity': return Activity;
      default: return Watch;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Watch className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Wearable Devices
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sync water data from your devices
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {!syncResult ? (
              <>
                {/* Device Selection */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap size={16} className="text-purple-600" />
                    Select Your Device
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {devices.map((device) => {
                      const Icon = getDeviceIcon(device.icon);
                      const isSelected = selectedDevice === device.id;
                      const isDisabled = syncing;
                      
                      return (
                        <motion.button
                          key={device.id}
                          onClick={() => !isDisabled && handleSync(device.id)}
                          disabled={isDisabled}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-slate-200 dark:border-slate-600 hover:border-purple-400'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          whileHover={!isDisabled ? { scale: 1.05 } : {}}
                          whileTap={!isDisabled ? { scale: 0.95 } : {}}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Icon className={`w-8 h-8 ${device.color}`} />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {device.name}
                            </span>
                            {isSelected && syncing && (
                              <Loader className="w-4 h-4 text-purple-600 animate-spin" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <div className="font-semibold mb-1">Demo Mode</div>
                    <div>
                      This is a demonstration of wearable device integration. In a production app, this would connect to real health APIs.
                      For now, it generates sample data for the last 3 days.
                    </div>
                  </div>
                </div>

                {syncing && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 flex flex-col items-center gap-3">
                    <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                    <div className="text-center">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Syncing with {devices.find(d => d.id === selectedDevice)?.name}...
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Fetching your water intake data
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Sync Results */
              <div className="space-y-4">
                {syncResult.success ? (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-700 dark:text-green-400 text-lg">
                          Sync Successful!
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-300 mt-1">
                          Successfully imported {syncResult.entriesAdded} water entries from {devices.find(d => d.id === selectedDevice)?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-700 dark:text-red-400 text-lg">
                          Sync Failed
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                          Unable to sync with {devices.find(d => d.id === selectedDevice)?.name}. Please try again.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <motion.button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Done
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

