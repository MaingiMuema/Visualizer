import { VisualizerConfig } from '../components/Visualizer';

export interface VisualizationPreset {
  id: string;
  name: string;
  description: string;
  config: VisualizerConfig;
  effects: {
    [effectId: string]: {
      enabled: boolean;
      intensity: number;
    };
  };
  thumbnail?: string;
  tags: string[];
}

export const DEFAULT_PRESETS: VisualizationPreset[] = [
  {
    id: 'classic-bars',
    name: 'Classic Bars',
    description: 'Traditional frequency bars with rainbow colors',
    config: {
      mode: 'frequencyBars',
      colorScheme: 'rainbow',
      sensitivity: 1.2,
      smoothing: 0.8,
      particleCount: 50,
      showBeatFlash: true,
    },
    effects: {
      beatFlash: { enabled: true, intensity: 0.8 },
      trail: { enabled: true, intensity: 0.5 },
      pulse: { enabled: true, intensity: 0.6 },
      colorShift: { enabled: false, intensity: 0.3 },
      rotation: { enabled: false, intensity: 0.2 },
      glitch: { enabled: false, intensity: 0.4 },
      bloom: { enabled: false, intensity: 0.5 },
      kaleidoscope: { enabled: false, intensity: 0.6 },
    },
    tags: ['classic', 'simple', 'colorful'],
  },
  {
    id: 'neon-tunnel',
    name: 'Neon Tunnel',
    description: 'Futuristic tunnel effect with neon colors',
    config: {
      mode: 'tunnel',
      colorScheme: 'neon',
      sensitivity: 1.5,
      smoothing: 0.6,
      particleCount: 200,
      showBeatFlash: true,
    },
    effects: {
      beatFlash: { enabled: true, intensity: 1.0 },
      trail: { enabled: true, intensity: 0.8 },
      pulse: { enabled: true, intensity: 0.8 },
      colorShift: { enabled: true, intensity: 0.7 },
      rotation: { enabled: true, intensity: 0.3 },
      glitch: { enabled: false, intensity: 0.4 },
      bloom: { enabled: true, intensity: 0.6 },
      kaleidoscope: { enabled: false, intensity: 0.6 },
    },
    tags: ['futuristic', 'neon', 'tunnel', 'intense'],
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Smooth waveforms with ocean-inspired colors',
    config: {
      mode: 'waveform',
      colorScheme: 'ocean',
      sensitivity: 0.8,
      smoothing: 0.9,
      particleCount: 80,
      showBeatFlash: false,
    },
    effects: {
      beatFlash: { enabled: false, intensity: 0.5 },
      trail: { enabled: true, intensity: 0.9 },
      pulse: { enabled: true, intensity: 0.4 },
      colorShift: { enabled: true, intensity: 0.5 },
      rotation: { enabled: false, intensity: 0.2 },
      glitch: { enabled: false, intensity: 0.4 },
      bloom: { enabled: true, intensity: 0.4 },
      kaleidoscope: { enabled: false, intensity: 0.6 },
    },
    tags: ['calm', 'smooth', 'ocean', 'relaxing'],
  },
  {
    id: 'fire-storm',
    name: 'Fire Storm',
    description: 'Intense particle effects with fire colors',
    config: {
      mode: 'particles',
      colorScheme: 'fire',
      sensitivity: 2.0,
      smoothing: 0.5,
      particleCount: 300,
      showBeatFlash: true,
    },
    effects: {
      beatFlash: { enabled: true, intensity: 1.0 },
      trail: { enabled: true, intensity: 0.6 },
      pulse: { enabled: true, intensity: 1.0 },
      colorShift: { enabled: true, intensity: 0.8 },
      rotation: { enabled: false, intensity: 0.2 },
      glitch: { enabled: true, intensity: 0.3 },
      bloom: { enabled: true, intensity: 0.8 },
      kaleidoscope: { enabled: false, intensity: 0.6 },
    },
    tags: ['intense', 'fire', 'particles', 'energetic'],
  },
  {
    id: 'cosmic-galaxy',
    name: 'Cosmic Galaxy',
    description: 'Multi-layered galaxy visualization with all effects',
    config: {
      mode: 'galaxy',
      colorScheme: 'purple',
      sensitivity: 1.3,
      smoothing: 0.7,
      particleCount: 250,
      showBeatFlash: true,
    },
    effects: {
      beatFlash: { enabled: true, intensity: 0.7 },
      trail: { enabled: true, intensity: 0.7 },
      pulse: { enabled: true, intensity: 0.7 },
      colorShift: { enabled: true, intensity: 0.6 },
      rotation: { enabled: true, intensity: 0.4 },
      glitch: { enabled: false, intensity: 0.4 },
      bloom: { enabled: true, intensity: 0.7 },
      kaleidoscope: { enabled: true, intensity: 0.5 },
    },
    tags: ['complex', 'galaxy', 'cosmic', 'multi-layer'],
  },
  {
    id: 'minimal-blue',
    name: 'Minimal Blue',
    description: 'Clean and minimal design with blue tones',
    config: {
      mode: 'circularSpectrum',
      colorScheme: 'blue',
      sensitivity: 1.0,
      smoothing: 0.8,
      particleCount: 30,
      showBeatFlash: false,
    },
    effects: {
      beatFlash: { enabled: false, intensity: 0.5 },
      trail: { enabled: true, intensity: 0.3 },
      pulse: { enabled: true, intensity: 0.5 },
      colorShift: { enabled: false, intensity: 0.3 },
      rotation: { enabled: true, intensity: 0.2 },
      glitch: { enabled: false, intensity: 0.4 },
      bloom: { enabled: false, intensity: 0.5 },
      kaleidoscope: { enabled: false, intensity: 0.6 },
    },
    tags: ['minimal', 'clean', 'blue', 'simple'],
  },
  {
    id: 'retro-glitch',
    name: 'Retro Glitch',
    description: 'Retro-style visualization with glitch effects',
    config: {
      mode: 'frequencyBars',
      colorScheme: 'neon',
      sensitivity: 1.4,
      smoothing: 0.6,
      particleCount: 100,
      showBeatFlash: true,
    },
    effects: {
      beatFlash: { enabled: true, intensity: 0.9 },
      trail: { enabled: true, intensity: 0.4 },
      pulse: { enabled: true, intensity: 0.8 },
      colorShift: { enabled: true, intensity: 0.9 },
      rotation: { enabled: false, intensity: 0.2 },
      glitch: { enabled: true, intensity: 0.8 },
      bloom: { enabled: false, intensity: 0.5 },
      kaleidoscope: { enabled: false, intensity: 0.6 },
    },
    tags: ['retro', 'glitch', 'neon', 'vintage'],
  },
];

export class PresetManager {
  private static instance: PresetManager;
  private presets: Map<string, VisualizationPreset> = new Map();
  private customPresets: VisualizationPreset[] = [];

  constructor() {
    // Load default presets
    DEFAULT_PRESETS.forEach(preset => {
      this.presets.set(preset.id, preset);
    });

    // Load custom presets from localStorage
    this.loadCustomPresets();
  }

  static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      PresetManager.instance = new PresetManager();
    }
    return PresetManager.instance;
  }

  getAllPresets(): VisualizationPreset[] {
    return Array.from(this.presets.values());
  }

  getPreset(id: string): VisualizationPreset | undefined {
    return this.presets.get(id);
  }

  getPresetsByTag(tag: string): VisualizationPreset[] {
    return Array.from(this.presets.values()).filter(preset => 
      preset.tags.includes(tag)
    );
  }

  searchPresets(query: string): VisualizationPreset[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.presets.values()).filter(preset =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  saveCustomPreset(
    name: string,
    description: string,
    config: VisualizerConfig,
    effects: { [effectId: string]: { enabled: boolean; intensity: number } },
    tags: string[] = []
  ): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const preset: VisualizationPreset = {
      id,
      name,
      description,
      config: { ...config },
      effects: { ...effects },
      tags: ['custom', ...tags],
    };

    this.presets.set(id, preset);
    this.customPresets.push(preset);
    this.saveCustomPresetsToStorage();

    return id;
  }

  deleteCustomPreset(id: string): boolean {
    const preset = this.presets.get(id);
    if (!preset || !preset.tags.includes('custom')) {
      return false;
    }

    this.presets.delete(id);
    this.customPresets = this.customPresets.filter(p => p.id !== id);
    this.saveCustomPresetsToStorage();

    return true;
  }

  getCustomPresets(): VisualizationPreset[] {
    return this.customPresets;
  }

  exportPreset(id: string): string | null {
    const preset = this.presets.get(id);
    if (!preset) return null;

    return JSON.stringify(preset, null, 2);
  }

  importPreset(presetJson: string): string | null {
    try {
      const preset: VisualizationPreset = JSON.parse(presetJson);
      
      // Validate preset structure
      if (!preset.id || !preset.name || !preset.config || !preset.effects) {
        throw new Error('Invalid preset format');
      }

      // Generate new ID to avoid conflicts
      const newId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      preset.id = newId;
      preset.tags = ['imported', ...(preset.tags || [])];

      this.presets.set(newId, preset);
      this.customPresets.push(preset);
      this.saveCustomPresetsToStorage();

      return newId;
    } catch (error) {
      console.error('Failed to import preset:', error);
      return null;
    }
  }

  private loadCustomPresets(): void {
    try {
      const stored = localStorage.getItem('music-visualizer-custom-presets');
      if (stored) {
        const customPresets: VisualizationPreset[] = JSON.parse(stored);
        customPresets.forEach(preset => {
          this.presets.set(preset.id, preset);
          this.customPresets.push(preset);
        });
      }
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
  }

  private saveCustomPresetsToStorage(): void {
    try {
      localStorage.setItem(
        'music-visualizer-custom-presets',
        JSON.stringify(this.customPresets)
      );
    } catch (error) {
      console.error('Failed to save custom presets:', error);
    }
  }

  // Utility methods
  static createPresetFromCurrent(
    name: string,
    description: string,
    config: VisualizerConfig,
    effects: { [effectId: string]: { enabled: boolean; intensity: number } },
    tags: string[] = []
  ): VisualizationPreset {
    return {
      id: `temp-${Date.now()}`,
      name,
      description,
      config: { ...config },
      effects: { ...effects },
      tags: ['custom', ...tags],
    };
  }

  static getRecommendedPresets(musicGenre?: string): VisualizationPreset[] {
    const manager = PresetManager.getInstance();
    
    if (!musicGenre) {
      return [
        manager.getPreset('classic-bars'),
        manager.getPreset('neon-tunnel'),
        manager.getPreset('ocean-waves'),
      ].filter(Boolean) as VisualizationPreset[];
    }

    const genreMap: { [genre: string]: string[] } = {
      'electronic': ['neon-tunnel', 'retro-glitch', 'cosmic-galaxy'],
      'rock': ['fire-storm', 'classic-bars', 'retro-glitch'],
      'classical': ['ocean-waves', 'minimal-blue', 'cosmic-galaxy'],
      'jazz': ['ocean-waves', 'minimal-blue', 'classic-bars'],
      'pop': ['classic-bars', 'neon-tunnel', 'fire-storm'],
      'ambient': ['ocean-waves', 'cosmic-galaxy', 'minimal-blue'],
    };

    const presetIds = genreMap[musicGenre.toLowerCase()] || ['classic-bars', 'neon-tunnel', 'ocean-waves'];
    
    return presetIds
      .map(id => manager.getPreset(id))
      .filter(Boolean) as VisualizationPreset[];
  }
}
