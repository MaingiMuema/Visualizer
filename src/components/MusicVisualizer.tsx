'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioUploader from './AudioUploader';
import Visualizer, { VisualizerConfig } from './Visualizer';
import StoryVisualizer from './StoryVisualizer';

import ControlPanel from './ControlPanel';
import ExportDialog from './ExportDialog';
import PresetSelector from './PresetSelector';
import { AudioAnalyzer, AudioAnalysisData } from '../utils/audioAnalyzer';
import { AdvancedBeatDetector, BeatData } from '../utils/beatDetector';
import { EffectsEngine } from '../utils/effectsEngine';
import { VideoExporter } from '../utils/videoExporter';
import { PresetManager, VisualizationPreset } from '../utils/presets';
import { StoryThemeEngine, StoryTheme, MusicCharacteristics } from '../utils/storyThemeEngine';
import { PollinationsAI, GeneratedImage } from '../utils/pollinationsAI';
import { AdvancedAudioAnalyzer } from '../utils/advancedAudioAnalysis';
import { NarrativeTransitionEngine } from '../utils/narrativeTransitions';

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

  // Story mode state
  const [isStoryMode, setIsStoryMode] = useState(true);
  const [musicCharacteristics, setMusicCharacteristics] = useState<MusicCharacteristics | null>(null);
  const [currentTheme, setCurrentTheme] = useState<StoryTheme | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<GeneratedImage | null>(null);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);

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
  const animationRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Story mode refs
  const storyThemeEngineRef = useRef<StoryThemeEngine | null>(null);
  const pollinationsAIRef = useRef<PollinationsAI | null>(null);
  const advancedAudioAnalyzerRef = useRef<AdvancedAudioAnalyzer | null>(null);
  const narrativeTransitionEngineRef = useRef<NarrativeTransitionEngine | null>(null);

  // Initialize audio processing components
  useEffect(() => {
    audioAnalyzerRef.current = new AudioAnalyzer({
      fftSize: 2048,
      smoothingTimeConstant: config.smoothing,
    });

    beatDetectorRef.current = new AdvancedBeatDetector();
    effectsEngineRef.current = new EffectsEngine();

    // Initialize story mode engines
    storyThemeEngineRef.current = new StoryThemeEngine();
    pollinationsAIRef.current = new PollinationsAI();
    advancedAudioAnalyzerRef.current = new AdvancedAudioAnalyzer();
    narrativeTransitionEngineRef.current = new NarrativeTransitionEngine();

    return () => {
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.destroy();
      }
    };
  }, [config.smoothing]);

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

    // Story mode analysis
    if (storyThemeEngineRef.current && advancedAudioAnalyzerRef.current) {
      // Advanced audio analysis
      const advancedFeatures = advancedAudioAnalyzerRef.current.analyzeAdvancedFeatures(
        analysisData,
        beatAnalysis,
        analysisData.timeData,
        analysisData.frequencyData
      );

      // Generate music characteristics
      const musicChars = advancedAudioAnalyzerRef.current.generateMusicCharacteristics(
        analysisData,
        beatAnalysis,
        advancedFeatures
      );

      // Only update if significantly different to prevent infinite loops
      setMusicCharacteristics(prevChars => {
        if (!prevChars ||
            prevChars.mood !== musicChars.mood ||
            prevChars.genre !== musicChars.genre ||
            Math.abs(prevChars.energy - musicChars.energy) > 0.1 ||
            Math.abs(prevChars.tempo - musicChars.tempo) > 10) {
          return musicChars;
        }
        return prevChars;
      });

      // Auto-select appropriate theme
      const selectedTheme = storyThemeEngineRef.current.selectTheme(musicChars);
      setCurrentTheme(selectedTheme);

      // Handle narrative transitions
      if (narrativeTransitionEngineRef.current && currentTheme) {
        narrativeTransitionEngineRef.current.update(
          analysisData,
          beatAnalysis,
          musicChars,
          currentTheme,
          0.016 // ~60fps delta time
        );
      }
    }

    // Update current time
    setCurrentTime(analyzer.getCurrentTime());

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, currentTheme]);

  // Generate background image when theme changes
  useEffect(() => {
    const generateBackground = async () => {
      if (currentTheme && musicCharacteristics && pollinationsAIRef.current && !isGeneratingBackground) {
        setIsGeneratingBackground(true);
        try {
          const image = await pollinationsAIRef.current.generateStoryBackground(
            currentTheme,
            musicCharacteristics,
            'middle',
            { width: 1920, height: 1080, quality: 'high' }
          );
          setBackgroundImage(image);
        } catch (error) {
          console.error('Failed to generate background:', error);
        } finally {
          setIsGeneratingBackground(false);
        }
      }
    };

    generateBackground();
  }, [currentTheme, musicCharacteristics, isGeneratingBackground]);

  // Start animation loop when playing
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



  const handleVisualizationModeToggle = () => {
    setIsStoryMode(!isStoryMode);
  };

  const effects = effectsEngineRef.current?.getAllEffects() || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Immersive Music Visualizer
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Upload your music and experience captivating 3D morphing backgrounds that dance to your beats
          </p>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            AI-Generated Backgrounds • Real-time 3D Effects • Watermark-Free Images
          </div>
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
            {/* Background Effects Info */}
            {isStoryMode && musicCharacteristics && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Immersive Background Effects Active
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="font-medium">Energy:</span>
                    <span className="ml-1">{Math.round(musicCharacteristics.energy * 100)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Tempo:</span>
                    <span className="ml-1">{Math.round(musicCharacteristics.tempo)} BPM</span>
                  </div>
                  <div>
                    <span className="font-medium">Mood:</span>
                    <span className="ml-1 capitalize">{musicCharacteristics.mood}</span>
                  </div>
                  <div>
                    <span className="font-medium">Genre:</span>
                    <span className="ml-1 capitalize">{musicCharacteristics.genre}</span>
                  </div>
                </div>

                {backgroundImage && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    ✓ AI Background: {backgroundImage.croppedUrl ? 'Watermark Removed' : 'Original'}
                  </div>
                )}
              </div>
            )}

            {/* Visualizer Container */}
            <div
              ref={containerRef}
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ height: '60vh', minHeight: '300px' }}
            >
              {isStoryMode ? (
                <StoryVisualizer
                  audioData={audioData}
                  beatData={beatData}
                  musicCharacteristics={musicCharacteristics}
                  storyTheme={currentTheme}
                  backgroundImage={backgroundImage}
                  width={dimensions.width}
                  height={dimensions.height}
                  isPlaying={isPlaying}
                />
              ) : (
                <Visualizer
                  audioData={audioData}
                  config={config}
                  width={dimensions.width}
                  height={dimensions.height}
                  isPlaying={isPlaying}
                  ref={canvasRef}
                />
              )}

              {/* Mode Toggle Button */}
              <button
                onClick={handleVisualizationModeToggle}
                className="absolute top-4 left-4 px-3 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white text-sm rounded transition-colors"
              >
                {isStoryMode ? '3D Story' : '2D Classic'}
              </button>

              {/* Overlay info */}
              {beatData && (
                <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
                  <div>BPM: {beatData.tempo}</div>
                  <div>Beat: {beatData.isBeat ? '●' : '○'}</div>
                  <div>Intensity: {(beatData.intensity * 100).toFixed(0)}%</div>
                  {musicCharacteristics && (
                    <>
                      <div>Energy: {Math.round(musicCharacteristics.energy * 100)}%</div>
                      <div>Mood: {musicCharacteristics.mood}</div>
                      <div>Genre: {musicCharacteristics.genre}</div>
                    </>
                  )}
                </div>
              )}

              {/* Background generation indicator */}
              {isGeneratingBackground && (
                <div className="absolute bottom-4 right-4 text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
                  Generating background...
                </div>
              )}

              {/* Preset Button */}
              {!isStoryMode && (
                <button
                  onClick={() => setShowPresetSelector(true)}
                  className="absolute top-4 right-4 px-3 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white text-sm rounded transition-colors"
                >
                  Presets
                </button>
              )}
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
