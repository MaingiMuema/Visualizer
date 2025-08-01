'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ExportOptions, ExportProgress, VideoExporter, checkExportSupport } from '../utils/videoExporter';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  audioBuffer: AudioBuffer | null;
  duration: number;
  onExportComplete: (blob: Blob, filename: string) => void;
}

export default function ExportDialog({
  isOpen,
  onClose,
  canvas,
  audioBuffer,
  duration,
  onExportComplete,
}: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'webm',
    quality: 'medium',
    fps: 30,
    duration: undefined,
    startTime: 0,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSupport, setExportSupport] = useState<ReturnType<typeof checkExportSupport> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExportSupport(checkExportSupport());
      setExportOptions(prev => ({
        ...prev,
        duration: duration,
      }));
    }
  }, [isOpen, duration]);

  const handleExport = async () => {
    if (!canvas || !audioBuffer || !exportSupport?.supported) return;

    setIsExporting(true);
    setExportError(null);
    setExportProgress(null);

    try {
      const exporter = new VideoExporter(canvas);
      
      const blob = await exporter.exportWithAudio(
        audioBuffer,
        exportOptions,
        (progress) => {
          setExportProgress(progress);
        }
      );

      const filename = `visualization_${Date.now()}.${exportOptions.format}`;
      onExportComplete(blob, filename);
      onClose();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedFileSize = (): string => {
    const bitrate = exportOptions.quality === 'low' ? 1 : exportOptions.quality === 'medium' ? 2.5 : 5;
    const durationToUse = exportOptions.duration || duration;
    const sizeMB = (bitrate * durationToUse) / 8; // Convert Mbps to MB
    return `~${sizeMB.toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Export Visualization
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isExporting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Support Check */}
          {exportSupport && !exportSupport.supported && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Export not supported
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {exportSupport.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {exportSupport?.supported && (
            <>
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    format: e.target.value as 'webm' | 'mp4' 
                  }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={isExporting}
                >
                  <option value="webm">WebM (Recommended)</option>
                  <option value="mp4">MP4</option>
                </select>
              </div>

              {/* Quality Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality
                </label>
                <select
                  value={exportOptions.quality}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    quality: e.target.value as 'low' | 'medium' | 'high' 
                  }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={isExporting}
                >
                  <option value="low">Low (1 Mbps)</option>
                  <option value="medium">Medium (2.5 Mbps)</option>
                  <option value="high">High (5 Mbps)</option>
                </select>
              </div>

              {/* FPS Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frame Rate: {exportOptions.fps} FPS
                </label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="15"
                  value={exportOptions.fps}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    fps: parseInt(e.target.value) 
                  }))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={isExporting}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>15</span>
                  <span>30</span>
                  <span>45</span>
                  <span>60</span>
                </div>
              </div>

              {/* Duration Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="fullDuration"
                      name="duration"
                      checked={exportOptions.duration === undefined}
                      onChange={() => setExportOptions(prev => ({ 
                        ...prev, 
                        duration: undefined,
                        startTime: 0 
                      }))}
                      disabled={isExporting}
                    />
                    <label htmlFor="fullDuration" className="text-sm text-gray-700 dark:text-gray-300">
                      Full track ({formatTime(duration)})
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="customDuration"
                      name="duration"
                      checked={exportOptions.duration !== undefined}
                      onChange={() => setExportOptions(prev => ({ 
                        ...prev, 
                        duration: 30 
                      }))}
                      disabled={isExporting}
                    />
                    <label htmlFor="customDuration" className="text-sm text-gray-700 dark:text-gray-300">
                      Custom duration
                    </label>
                  </div>
                  
                  {exportOptions.duration !== undefined && (
                    <div className="ml-6 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Start time (seconds)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={duration}
                          value={exportOptions.startTime || 0}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            startTime: Math.max(0, Math.min(duration, parseFloat(e.target.value) || 0))
                          }))}
                          className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          disabled={isExporting}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Duration (seconds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={duration - (exportOptions.startTime || 0)}
                          value={exportOptions.duration}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            duration: Math.max(1, Math.min(duration - (prev.startTime || 0), parseFloat(e.target.value) || 1))
                          }))}
                          className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          disabled={isExporting}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File Size Estimate */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated file size: <span className="font-medium">{getEstimatedFileSize()}</span>
                </div>
              </div>

              {/* Export Progress */}
              {isExporting && exportProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Exporting...</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {Math.round(exportProgress.progress * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress.progress * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Frame {exportProgress.currentFrame} of {exportProgress.totalFrames} • 
                    {exportProgress.timeRemaining > 0 && (
                      <span> {Math.ceil(exportProgress.timeRemaining)}s remaining</span>
                    )}
                  </div>
                </div>
              )}

              {/* Export Error */}
              {exportError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-700 dark:text-red-300">{exportError}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            disabled={isExporting}
          >
            Cancel
          </button>
          
          {exportSupport?.supported && (
            <button
              onClick={handleExport}
              disabled={isExporting || !canvas || !audioBuffer}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              {isExporting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
