'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioUploader from './AudioUploader';
import Visualizer, { VisualizerConfig } from './Visualizer';
import ControlPanel from './ControlPanel';
import ExportDialog from './ExportDialog';
import PresetSelector from './PresetSelector';
import { AudioAnalyzer, AudioAnalysisData } from '../utils/audioAnalyzer';
import { AdvancedBeatDetector, BeatData } from '../utils/beatDetector';
import { EffectsEngine } from '../utils/effectsEngine';
import { VideoExporter } from '../utils/videoExporter';
import { PresetManager, VisualizationPreset } from '../utils/presets';

interface AudioFile {
  file: File;
  name: string;
  size: number;
  duration?: number;
  audioBuffer?: AudioBuffer;
}

export default function MusicVisualizer() {
  // Audio state
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  
  // Analysis state
  const [audioData, setAudioData] = useState<AudioAnalysisData | null>(null);
  const [beatData, setBeatData] = useState<BeatData | null>(null);
  
  // Visualization config
  const [config, setConfig] = useState<VisualizerConfig>({
    mode: 'frequencyBars',
    colorScheme: 'rainbow',
    sensitivity: 1.0,
    smoothing: 0.8,
    particleCount: 100,
    showBeatFlash: true,
  });
  
  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Preset state
  const [showPresetSelector, setShowPresetSelector] = useState(false);

  // Refs for audio processing
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const beatDetectorRef = useRef<AdvancedBeatDetector | null>(null);
  const effectsEngineRef = useRef<EffectsEngine | null>(null);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Initialize audio processing components
  useEffect(() => {
    audioAnalyzerRef.current = new AudioAnalyzer({
      fftSize: 2048,
      smoothingTimeConstant: config.smoothing,
    });
    
    beatDetectorRef.current = new AdvancedBeatDetector();
    effectsEngineRef.current = new EffectsEngine();
    
    return () => {
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.destroy();
      }
    };
  }, []);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.max(400, rect.height),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Animation loop for real-time analysis
  const animate = useCallback(() => {
    if (!audioAnalyzerRef.current || !beatDetectorRef.current || !isPlaying) {
      return;
    }

    const analyzer = audioAnalyzerRef.current;
    const beatDetector = beatDetectorRef.current;
    
    // Get audio analysis data
    const analysisData = analyzer.getAnalysisData();
    setAudioData(analysisData);
    
    // Get beat detection data
    const beatAnalysis = beatDetector.analyze(
      analysisData.frequencyData,
      analysisData.timeData,
      analysisData.bass,
      analysisData.mid,
      analysisData.treble
    );
    setBeatData(beatAnalysis);
    
    // Update current time
    setCurrentTime(analyzer.getCurrentTime());
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Audio file handling
  const handleFileSelect = async (audioFile: AudioFile) => {
    setIsProcessing(true);
    try {
      if (audioAnalyzerRef.current && audioFile.audioBuffer) {
        await audioAnalyzerRef.current.loadAudioBuffer(audioFile.audioBuffer);
        setSelectedFile(audioFile);
        
        // Reset analysis components
        if (beatDetectorRef.current) {
          beatDetectorRef.current.reset();
        }
        if (effectsEngineRef.current) {
          effectsEngineRef.current.reset();
        }
      }
    } catch (error) {
      console.error('Error loading audio file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileRemove = () => {
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.stop();
    }
    setSelectedFile(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioData(null);
    setBeatData(null);
  };

  // Playback controls
  const handlePlay = () => {
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (time: number) => {
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.seekTo(time);
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.setVolume(newVolume);
    }
  };

  // Configuration changes
  const handleConfigChange = (newConfig: Partial<VisualizerConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    // Update analyzer smoothing if changed
    if (newConfig.smoothing !== undefined && audioAnalyzerRef.current) {
      // Note: Would need to recreate analyzer for smoothing change
      // For now, we'll just update the config
    }
  };

  // Effects controls
  const handleEffectToggle = (effectId: string, enabled: boolean) => {
    if (effectsEngineRef.current) {
      effectsEngineRef.current.enableEffect(effectId, enabled);
    }
  };

  const handleEffectIntensityChange = (effectId: string, intensity: number) => {
    if (effectsEngineRef.current) {
      effectsEngineRef.current.setEffectIntensity(effectId, intensity);
    }
  };

  // Utility functions
  const handleReset = () => {
    handleStop();
    if (beatDetectorRef.current) {
      beatDetectorRef.current.reset();
    }
    if (effectsEngineRef.current) {
      effectsEngineRef.current.reset();
    }
    setAudioData(null);
    setBeatData(null);
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handleExportComplete = (blob: Blob, filename: string) => {
    VideoExporter.downloadBlob(blob, filename);
  };

  // Preset handling
  const handlePresetSelect = (preset: VisualizationPreset) => {
    setConfig(preset.config);

    // Apply effects settings
    if (effectsEngineRef.current) {
      Object.entries(preset.effects).forEach(([effectId, settings]) => {
        effectsEngineRef.current!.enableEffect(effectId, settings.enabled);
        effectsEngineRef.current!.setEffectIntensity(effectId, settings.intensity);
      });
    }
  };

  const handleSavePreset = (name: string, description: string, tags: string[]) => {
    const presetManager = PresetManager.getInstance();
    const effects = effectsEngineRef.current?.getAllEffects() || [];

    const effectsSettings: { [effectId: string]: { enabled: boolean; intensity: number } } = {};
    effects.forEach(effect => {
      effectsSettings[effect.id] = {
        enabled: effect.enabled,
        intensity: effect.intensity,
      };
    });

    presetManager.saveCustomPreset(name, description, config, effectsSettings, tags);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const effects = effectsEngineRef.current?.getAllEffects() || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Music Visualizer
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Upload your music and watch it come to life with dynamic visualizations
          </p>
        </div>

        {!selectedFile ? (
          <AudioUploader
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="space-y-6">
            {/* Visualizer Container */}
            <div
              ref={containerRef}
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ height: '60vh', minHeight: '300px' }}
            >
              <Visualizer
                audioData={audioData}
                config={config}
                width={dimensions.width}
                height={dimensions.height}
                isPlaying={isPlaying}
                ref={canvasRef}
              />
              
              {/* Overlay info */}
              {beatData && (
                <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
                  <div>BPM: {beatData.tempo}</div>
                  <div>Beat: {beatData.isBeat ? '●' : '○'}</div>
                  <div>Intensity: {(beatData.intensity * 100).toFixed(0)}%</div>
                </div>
              )}

              {/* Preset Button */}
              <button
                onClick={() => setShowPresetSelector(true)}
                className="absolute top-4 right-4 px-3 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white text-sm rounded transition-colors"
              >
                Presets
              </button>
            </div>

            {/* Control Panel */}
            <ControlPanel
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={selectedFile.duration || 0}
              volume={volume}
              config={config}
              effects={effects}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onConfigChange={handleConfigChange}
              onEffectToggle={handleEffectToggle}
              onEffectIntensityChange={handleEffectIntensityChange}
              onReset={handleReset}
              onExport={handleExport}
              onFullscreen={handleFullscreen}
            />

            {/* File Info */}
            <div className="text-center">
              <button
                onClick={handleFileRemove}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Remove file and upload new one
              </button>
            </div>
          </div>
        )}

        {/* Export Dialog */}
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          canvas={canvasRef.current}
          audioBuffer={selectedFile?.audioBuffer || null}
          duration={selectedFile?.duration || 0}
          onExportComplete={handleExportComplete}
        />

        {/* Preset Selector */}
        <PresetSelector
          isOpen={showPresetSelector}
          onClose={() => setShowPresetSelector(false)}
          currentConfig={config}
          currentEffects={effects.reduce((acc, effect) => {
            acc[effect.id] = { enabled: effect.enabled, intensity: effect.intensity };
            return acc;
          }, {} as { [effectId: string]: { enabled: boolean; intensity: number } })}
          onPresetSelect={handlePresetSelect}
          onSavePreset={handleSavePreset}
        />
      </div>
    </div>
  );
}
