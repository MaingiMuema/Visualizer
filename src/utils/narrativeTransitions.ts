import { StoryTheme, MusicCharacteristics, StoryScene } from './storyThemeEngine';
import { AudioAnalysisData } from './audioAnalyzer';
import { BeatData } from './beatDetector';

export interface TransitionTrigger {
  type: 'energy_change' | 'tempo_change' | 'mood_change' | 'beat_pattern' | 'frequency_shift' | 'manual';
  threshold: number;
  duration: number; // in seconds
  priority: number; // higher priority transitions override lower ones
}

export interface TransitionEffect {
  id: string;
  name: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'spiral' | 'particle_burst' | 'color_shift';
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  parameters: Record<string, any>;
}

export interface ActiveTransition {
  id: string;
  fromScene: StoryScene | null;
  toScene: StoryScene;
  effect: TransitionEffect;
  startTime: number;
  duration: number;
  progress: number; // 0 to 1
  isActive: boolean;
}

export interface SceneTransitionRule {
  fromTheme: string;
  toTheme: string;
  triggers: TransitionTrigger[];
  effects: TransitionEffect[];
  conditions: {
    minDuration: number; // minimum time in current scene before transition
    energyDelta: number; // minimum energy change required
    moodCompatibility: string[]; // compatible moods for smooth transition
  };
}

export class NarrativeTransitionEngine {
  private transitionRules: Map<string, SceneTransitionRule[]> = new Map();
  private activeTransition: ActiveTransition | null = null;
  private currentScene: StoryScene | null = null;
  private sceneStartTime: number = 0;
  private musicHistory: MusicCharacteristics[] = [];
  private transitionHistory: ActiveTransition[] = [];
  private transitionEffects: Map<string, TransitionEffect> = new Map();

  constructor() {
    this.initializeTransitionEffects();
    this.initializeTransitionRules();
  }

  private initializeTransitionEffects(): void {
    const effects: TransitionEffect[] = [
      {
        id: 'fade',
        name: 'Fade Transition',
        type: 'fade',
        duration: 2.0,
        easing: 'ease-in-out',
        parameters: { fadeColor: '#000000' }
      },
      {
        id: 'dissolve',
        name: 'Dissolve',
        type: 'dissolve',
        duration: 3.0,
        easing: 'ease-out',
        parameters: { particleCount: 1000, dissolvePattern: 'random' }
      },
      {
        id: 'spiral',
        name: 'Spiral Transition',
        type: 'spiral',
        duration: 4.0,
        easing: 'ease-in-out',
        parameters: { spiralDirection: 'clockwise', rotations: 2 }
      },
      {
        id: 'particle_burst',
        name: 'Particle Burst',
        type: 'particle_burst',
        duration: 2.5,
        easing: 'bounce',
        parameters: { burstIntensity: 1.0, particleLifetime: 3.0 }
      },
      {
        id: 'color_shift',
        name: 'Color Shift',
        type: 'color_shift',
        duration: 3.5,
        easing: 'ease-in-out',
        parameters: { shiftSpeed: 1.0, blendMode: 'multiply' }
      },
      {
        id: 'zoom',
        name: 'Zoom Transition',
        type: 'zoom',
        duration: 2.0,
        easing: 'ease-in',
        parameters: { zoomFactor: 10.0, zoomCenter: [0, 0, 0] }
      }
    ];

    effects.forEach(effect => {
      this.transitionEffects.set(effect.id, effect);
    });
  }

  private initializeTransitionRules(): void {
    // Space Odyssey to Underwater Adventure
    this.addTransitionRule({
      fromTheme: 'space-odyssey',
      toTheme: 'underwater-adventure',
      triggers: [
        {
          type: 'energy_change',
          threshold: -0.3, // energy decreases
          duration: 5.0,
          priority: 8
        },
        {
          type: 'mood_change',
          threshold: 0.5,
          duration: 3.0,
          priority: 7
        }
      ],
      effects: [
        this.transitionEffects.get('dissolve')!,
        this.transitionEffects.get('color_shift')!
      ],
      conditions: {
        minDuration: 15.0,
        energyDelta: 0.2,
        moodCompatibility: ['calm', 'mysterious', 'romantic']
      }
    });

    // Underwater Adventure to Space Odyssey
    this.addTransitionRule({
      fromTheme: 'underwater-adventure',
      toTheme: 'space-odyssey',
      triggers: [
        {
          type: 'energy_change',
          threshold: 0.4, // energy increases
          duration: 4.0,
          priority: 8
        },
        {
          type: 'tempo_change',
          threshold: 20, // BPM increase
          duration: 3.0,
          priority: 6
        }
      ],
      effects: [
        this.transitionEffects.get('spiral')!,
        this.transitionEffects.get('particle_burst')!
      ],
      conditions: {
        minDuration: 12.0,
        energyDelta: 0.3,
        moodCompatibility: ['energetic', 'uplifting', 'mysterious']
      }
    });

    // Any theme to Abstract Dreams (fallback)
    ['space-odyssey', 'underwater-adventure', 'forest-journey', 'urban-nightscape'].forEach(theme => {
      this.addTransitionRule({
        fromTheme: theme,
        toTheme: 'abstract-dreams',
        triggers: [
          {
            type: 'frequency_shift',
            threshold: 0.6,
            duration: 6.0,
            priority: 5
          }
        ],
        effects: [
          this.transitionEffects.get('fade')!,
          this.transitionEffects.get('zoom')!
        ],
        conditions: {
          minDuration: 20.0,
          energyDelta: 0.1,
          moodCompatibility: ['mysterious', 'dark', 'calm']
        }
      });
    });
  }

  private addTransitionRule(rule: SceneTransitionRule): void {
    const key = `${rule.fromTheme}-${rule.toTheme}`;
    if (!this.transitionRules.has(rule.fromTheme)) {
      this.transitionRules.set(rule.fromTheme, []);
    }
    this.transitionRules.get(rule.fromTheme)!.push(rule);
  }

  update(
    audioData: AudioAnalysisData,
    beatData: BeatData,
    musicCharacteristics: MusicCharacteristics,
    currentTheme: StoryTheme,
    deltaTime: number
  ): ActiveTransition | null {
    const currentTime = Date.now() / 1000;

    // Store music characteristics for trend analysis
    this.musicHistory.push(musicCharacteristics);
    if (this.musicHistory.length > 100) {
      this.musicHistory.shift();
    }

    // Update active transition
    if (this.activeTransition) {
      this.updateActiveTransition(deltaTime);
      if (!this.activeTransition.isActive) {
        this.completeTransition();
      }
      return this.activeTransition;
    }

    // Check for new transitions
    const potentialTransition = this.evaluateTransitionTriggers(
      audioData,
      beatData,
      musicCharacteristics,
      currentTheme,
      currentTime
    );

    if (potentialTransition) {
      this.startTransition(potentialTransition);
      return this.activeTransition;
    }

    return null;
  }

  private updateActiveTransition(deltaTime: number): void {
    if (!this.activeTransition) return;

    this.activeTransition.progress += deltaTime / this.activeTransition.duration;
    
    if (this.activeTransition.progress >= 1.0) {
      this.activeTransition.progress = 1.0;
      this.activeTransition.isActive = false;
    }
  }

  private completeTransition(): void {
    if (!this.activeTransition) return;

    // Store in history
    this.transitionHistory.push({ ...this.activeTransition });
    if (this.transitionHistory.length > 20) {
      this.transitionHistory.shift();
    }

    // Update current scene
    this.currentScene = this.activeTransition.toScene;
    this.sceneStartTime = Date.now() / 1000;
    this.activeTransition = null;
  }

  private evaluateTransitionTriggers(
    audioData: AudioAnalysisData,
    beatData: BeatData,
    musicCharacteristics: MusicCharacteristics,
    currentTheme: StoryTheme,
    currentTime: number
  ): { toTheme: StoryTheme; effect: TransitionEffect } | null {
    const timeSinceSceneStart = currentTime - this.sceneStartTime;
    const rules = this.transitionRules.get(currentTheme.id) || [];

    let bestTransition: { toTheme: StoryTheme; effect: TransitionEffect; priority: number } | null = null;

    for (const rule of rules) {
      // Check minimum duration
      if (timeSinceSceneStart < rule.conditions.minDuration) continue;

      // Check energy delta
      if (this.musicHistory.length > 10) {
        const recentEnergy = this.musicHistory.slice(-5).reduce((sum, m) => sum + m.energy, 0) / 5;
        const olderEnergy = this.musicHistory.slice(-15, -10).reduce((sum, m) => sum + m.energy, 0) / 5;
        const energyDelta = Math.abs(recentEnergy - olderEnergy);
        
        if (energyDelta < rule.conditions.energyDelta) continue;
      }

      // Check mood compatibility
      if (!rule.conditions.moodCompatibility.includes(musicCharacteristics.mood)) continue;

      // Evaluate triggers
      for (const trigger of rule.triggers) {
        const triggerMet = this.evaluateTrigger(trigger, audioData, beatData, musicCharacteristics);
        
        if (triggerMet && (!bestTransition || trigger.priority > bestTransition.priority)) {
          // Find target theme (simplified - would need theme registry)
          const targetTheme = this.findThemeById(rule.toTheme);
          if (targetTheme) {
            const effect = rule.effects[Math.floor(Math.random() * rule.effects.length)];
            bestTransition = {
              toTheme: targetTheme,
              effect,
              priority: trigger.priority
            };
          }
        }
      }
    }

    return bestTransition ? { toTheme: bestTransition.toTheme, effect: bestTransition.effect } : null;
  }

  private evaluateTrigger(
    trigger: TransitionTrigger,
    audioData: AudioAnalysisData,
    beatData: BeatData,
    musicCharacteristics: MusicCharacteristics
  ): boolean {
    switch (trigger.type) {
      case 'energy_change':
        if (this.musicHistory.length < 10) return false;
        const recentEnergy = this.musicHistory.slice(-5).reduce((sum, m) => sum + m.energy, 0) / 5;
        const olderEnergy = this.musicHistory.slice(-10, -5).reduce((sum, m) => sum + m.energy, 0) / 5;
        const energyChange = recentEnergy - olderEnergy;
        return Math.abs(energyChange) >= Math.abs(trigger.threshold);

      case 'tempo_change':
        if (this.musicHistory.length < 5) return false;
        const recentTempo = this.musicHistory.slice(-3).reduce((sum, m) => sum + m.tempo, 0) / 3;
        const olderTempo = this.musicHistory.slice(-6, -3).reduce((sum, m) => sum + m.tempo, 0) / 3;
        const tempoChange = Math.abs(recentTempo - olderTempo);
        return tempoChange >= trigger.threshold;

      case 'mood_change':
        if (this.musicHistory.length < 3) return false;
        const previousMood = this.musicHistory[this.musicHistory.length - 3].mood;
        return previousMood !== musicCharacteristics.mood;

      case 'beat_pattern':
        return beatData.isBeat && beatData.confidence >= trigger.threshold;

      case 'frequency_shift':
        const bassRatio = audioData.bass / (audioData.bass + audioData.mid + audioData.treble);
        const trebleRatio = audioData.treble / (audioData.bass + audioData.mid + audioData.treble);
        const frequencyImbalance = Math.abs(bassRatio - trebleRatio);
        return frequencyImbalance >= trigger.threshold;

      default:
        return false;
    }
  }

  private findThemeById(themeId: string): StoryTheme | null {
    // This would typically query a theme registry
    // For now, return a basic theme structure
    const basicThemes: Record<string, StoryTheme> = {
      'space-odyssey': {
        id: 'space-odyssey',
        name: 'Space Odyssey',
        description: 'Cosmic journey through space',
        mood: ['mysterious', 'uplifting'],
        tempoRange: [80, 140],
        energyRange: [0.4, 1.0],
        colors: {
          primary: ['#0a0a2e', '#16213e'],
          secondary: ['#3b82f6', '#8b5cf6'],
          accent: ['#fbbf24', '#ffffff']
        },
        environments: ['space'],
        characters: ['spacecraft'],
        objects: ['planets'],
        atmospheres: ['cosmic'],
        narrativeElements: {
          beginning: ['launch'],
          middle: ['journey'],
          climax: ['discovery'],
          resolution: ['return']
        }
      },
      'underwater-adventure': {
        id: 'underwater-adventure',
        name: 'Underwater Adventure',
        description: 'Deep sea exploration',
        mood: ['calm', 'mysterious'],
        tempoRange: [60, 120],
        energyRange: [0.2, 0.8],
        colors: {
          primary: ['#0f172a', '#1e293b'],
          secondary: ['#0ea5e9', '#06b6d4'],
          accent: ['#22d3ee', '#67e8f9']
        },
        environments: ['ocean'],
        characters: ['sea creatures'],
        objects: ['coral'],
        atmospheres: ['underwater'],
        narrativeElements: {
          beginning: ['dive'],
          middle: ['explore'],
          climax: ['discovery'],
          resolution: ['surface']
        }
      }
    };

    return basicThemes[themeId] || null;
  }

  private startTransition(transition: { toTheme: StoryTheme; effect: TransitionEffect }): void {
    const currentTime = Date.now() / 1000;
    
    this.activeTransition = {
      id: `transition_${Date.now()}`,
      fromScene: this.currentScene,
      toScene: {
        id: `scene_${Date.now()}`,
        themeId: transition.toTheme.id,
        name: transition.toTheme.name,
        description: transition.toTheme.description,
        duration: 30, // Default scene duration
        intensity: 0.5,
        visualElements: {
          background: 'generated',
          foreground: [],
          particles: ['default'],
          lighting: 'ambient'
        },
        animations: {
          camera: 'smooth',
          objects: ['float'],
          transitions: ['fade']
        }
      },
      effect: transition.effect,
      startTime: currentTime,
      duration: transition.effect.duration,
      progress: 0,
      isActive: true
    };
  }

  getActiveTransition(): ActiveTransition | null {
    return this.activeTransition;
  }

  getCurrentScene(): StoryScene | null {
    return this.currentScene;
  }

  getTransitionHistory(): ActiveTransition[] {
    return [...this.transitionHistory];
  }

  // Manual transition trigger
  triggerTransition(toThemeId: string, effectId?: string): boolean {
    const targetTheme = this.findThemeById(toThemeId);
    if (!targetTheme) return false;

    const effect = effectId ? 
      this.transitionEffects.get(effectId) : 
      this.transitionEffects.get('fade');
    
    if (!effect) return false;

    this.startTransition({ toTheme: targetTheme, effect });
    return true;
  }

  // Get transition progress for rendering
  getTransitionProgress(): number {
    return this.activeTransition ? this.activeTransition.progress : 0;
  }

  // Get eased progress for smooth animations
  getEasedProgress(): number {
    if (!this.activeTransition) return 0;
    
    const progress = this.activeTransition.progress;
    const easing = this.activeTransition.effect.easing;
    
    switch (easing) {
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'bounce':
        return this.bounceEase(progress);
      case 'elastic':
        return this.elasticEase(progress);
      default:
        return progress;
    }
  }

  private bounceEase(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }

  private elasticEase(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
}
