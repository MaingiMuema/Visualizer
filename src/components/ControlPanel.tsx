'use client';

import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Settings, 
  Palette, 
  Zap,
  RotateCcw,
  Download,
  Maximize
} from 'lucide-react';
import { VisualizationMode, VisualizerConfig } from './Visualizer';
import { VisualEffect } from '../utils/effectsEngine';

interface ControlPanelProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  config: VisualizerConfig;
  effects: VisualEffect[];
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onConfigChange: (config: Partial<VisualizerConfig>) => void;
  onEffectToggle: (effectId: string, enabled: boolean) => void;
  onEffectIntensityChange: (effectId: string, intensity: number) => void;
  onReset: () => void;
  onExport: () => void;
  onFullscreen: () => void;
}

const visualizationModes: { value: VisualizationMode; label: string }[] = [
  { value: 'waveform', label: 'Waveform' },
  { value: 'frequencyBars', label: 'Frequency Bars' },
  { value: 'circularSpectrum', label: 'Circular Spectrum' },
  { value: 'particles', label: 'Particles' },
  { value: 'tunnel', label: 'Tunnel' },
  { value: 'galaxy', label: 'Galaxy' },
];

const colorSchemes: { value: VisualizerConfig['colorScheme']; label: string }[] = [
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'fire', label: 'Fire' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'neon', label: 'Neon' },
];

export default function ControlPanel({
  isPlaying,
  currentTime,
  duration,
  volume,
  config,
  effects,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  onConfigChange,
  onEffectToggle,
  onEffectIntensityChange,
  onReset,
  onExport,
  onFullscreen,
}: ControlPanelProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    onSeek(time);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
      {/* Playback Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            disabled={duration === 0}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <button
            onClick={onStop}
            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
            disabled={duration === 0}
          >
            <Square className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[40px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              onChange={handleSeekChange}
              className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              disabled={duration === 0}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value) / 100)}
              className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <button
            onClick={onFullscreen}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
          
          <button
            onClick={onExport}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button
            onClick={onReset}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualization Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Visualization</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mode
            </label>
            <select
              value={config.mode}
              onChange={(e) => onConfigChange({ mode: e.target.value as VisualizationMode })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {visualizationModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sensitivity: {config.sensitivity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={config.sensitivity}
              onChange={(e) => onConfigChange({ sensitivity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Smoothing: {config.smoothing.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.smoothing}
              onChange={(e) => onConfigChange({ smoothing: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Particle Count: {config.particleCount}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={config.particleCount}
              onChange={(e) => onConfigChange({ particleCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="beatFlash"
              checked={config.showBeatFlash}
              onChange={(e) => onConfigChange({ showBeatFlash: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="beatFlash" className="text-sm text-gray-700 dark:text-gray-300">
              Beat Flash
            </label>
          </div>
        </div>

        {/* Color Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Colors</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Scheme
            </label>
            <select
              value={config.colorScheme}
              onChange={(e) => onConfigChange({ colorScheme: e.target.value as VisualizerConfig['colorScheme'] })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {colorSchemes.map((scheme) => (
                <option key={scheme.value} value={scheme.value}>
                  {scheme.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => onConfigChange({ colorScheme: scheme.value })}
                className={`h-8 rounded border-2 transition-all ${
                  config.colorScheme === scheme.value
                    ? 'border-blue-500 scale-105'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
                style={{
                  background: scheme.value === 'rainbow'
                    ? 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)'
                    : scheme.value === 'blue'
                    ? 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                    : scheme.value === 'purple'
                    ? 'linear-gradient(90deg, #8b5cf6, #5b21b6)'
                    : scheme.value === 'fire'
                    ? 'linear-gradient(90deg, #f59e0b, #dc2626)'
                    : scheme.value === 'ocean'
                    ? 'linear-gradient(90deg, #06b6d4, #0284c7)'
                    : 'linear-gradient(90deg, #10b981, #059669)'
                }}
                title={scheme.label}
              />
            ))}
          </div>
        </div>

        {/* Effects Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Effects</h3>
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {effects.map((effect) => (
              <div key={effect.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={effect.id}
                      checked={effect.enabled}
                      onChange={(e) => onEffectToggle(effect.id, e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor={effect.id} className="text-sm text-gray-700 dark:text-gray-300">
                      {effect.name}
                    </label>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(effect.intensity * 100).toFixed(0)}%
                  </span>
                </div>
                
                {effect.enabled && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={effect.intensity}
                    onChange={(e) => onEffectIntensityChange(effect.id, parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
