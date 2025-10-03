import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, FileJson, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/AuthContext';

interface DataImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function DataImporter({ isOpen, onClose, onImportComplete }: DataImporterProps) {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    
    const validExtensions = ['.csv', '.json'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setResult({
        success: 0,
        failed: 0,
        errors: ['Invalid file type. Please use CSV or JSON files.']
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      let entries: any[] = [];

      // Parse based on file type
      if (fileExtension === '.json') {
        const data = JSON.parse(text);
        // Handle both array format and our export format
        entries = Array.isArray(data) ? data : (data.entries || []);
      } else if (fileExtension === '.csv') {
        entries = parseCSV(text);
      }

      // Validate and import entries
      const importResult = await importEntries(entries, user.id);
      setResult(importResult);
      
      if (importResult.success > 0) {
        onImportComplete();
      }
    } catch (error: any) {
      setResult({
        success: 0,
        failed: 0,
        errors: [`Import failed: ${error.message}`]
      });
    } finally {
      setImporting(false);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const entries: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      // Skip summary rows or empty lines
      if (values.length < headers.length || values[0].toLowerCase() === 'summary') continue;

      const entry: any = {};
      headers.forEach((header, index) => {
        entry[header] = values[index];
      });

      entries.push(entry);
    }

    return entries;
  };

  const importEntries = async (entries: any[], userId: string): Promise<ImportResult> => {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        // Extract and validate data
        const amount_ml = parseFloat(entry.amount_ml || entry['amount (ml)'] || entry.amount || '0');
        const source = (entry.source || 'import').toLowerCase();
        const note = entry.note || entry.notes || '';
        
        // Parse date and time
        let entryTimestamp = new Date();
        if (entry.date && entry.time) {
          entryTimestamp = new Date(`${entry.date}T${entry.time}`);
        } else if (entry.date) {
          entryTimestamp = new Date(entry.date);
        } else if (entry.timestamp) {
          entryTimestamp = new Date(entry.timestamp);
        }

        // Validate
        if (isNaN(amount_ml) || amount_ml <= 0) {
          errors.push(`Skipped invalid entry: amount=${amount_ml}`);
          failed++;
          continue;
        }

        // Insert into database
        const { error } = await supabase
          .from('hydration_entries')
          .insert([{
            user_id: userId,
            amount_ml: Math.round(amount_ml),
            source: ['manual', 'reminder', 'import', 'wearable'].includes(source) ? source : 'import',
            note: note || undefined,
            entry_ts: entryTimestamp.toISOString()
          }]);

        if (error) {
          errors.push(`Failed to import entry: ${error.message}`);
          failed++;
        } else {
          success++;
        }
      } catch (err: any) {
        errors.push(`Error processing entry: ${err.message}`);
        failed++;
      }
    }

    return { success, failed, errors: errors.slice(0, 5) }; // Limit error messages
  };

  const handleClose = () => {
    setResult(null);
    onClose();
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
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Import Water Data
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload CSV or JSON file
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
            {!result ? (
              <>
                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                  }`}
                >
                  {importing ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Importing data...
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                      <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
                        Drag and drop your file here
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        or
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".csv,.json"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={importing}
                        />
                        <span className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-block">
                          Choose File
                        </span>
                      </label>
                    </>
                  )}
                </div>

                {/* File Format Info */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    Supported Formats
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300">CSV Format</div>
                        <div className="text-xs">Headers: date, time, amount_ml, source, note</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileJson size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300">JSON Format</div>
                        <div className="text-xs">Array of objects or GoutDeau export format</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Import Results */
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6 space-y-4">
                  {result.success > 0 && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-700 dark:text-green-400">
                          Successfully imported {result.success} {result.success === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {result.failed > 0 && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-orange-700 dark:text-orange-400">
                          Failed to import {result.failed} {result.failed === 1 ? 'entry' : 'entries'}
                        </div>
                        {result.errors.length > 0 && (
                          <ul className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {result.errors.map((error, i) => (
                              <li key={i}>• {error}</li>
                            ))}
                            {result.failed > result.errors.length && (
                              <li>• ... and {result.failed - result.errors.length} more</li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <motion.button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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

