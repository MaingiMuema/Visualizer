import { AudioAnalysisData } from './audioAnalyzer';
import { BeatData } from './beatDetector';

export interface Effect {
  id: string;
  name: string;
  enabled: boolean;
  intensity: number;
  trigger: 'beat' | 'bass' | 'mid' | 'treble' | 'volume' | 'continuous';
  threshold: number;
}

export interface VisualEffect extends Effect {
  apply: (ctx: CanvasRenderingContext2D, audioData: AudioAnalysisData, beatData: BeatData, deltaTime: number) => void;
}

export interface ColorTransition {
  from: string;
  to: string;
  duration: number;
  startTime: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export class EffectsEngine {
  private effects: Map<string, VisualEffect> = new Map();
  private activeTransitions: ColorTransition[] = [];
  private lastBeatTime = 0;
  private beatFlashIntensity = 0;
  private colorShiftPhase = 0;
  private pulseScale = 1;
  private rotationAngle = 0;
  private glitchOffset = { x: 0, y: 0 };
  private trailOpacity = 0.1;

  constructor() {
    this.initializeEffects();
  }

  private initializeEffects(): void {
    // Beat Flash Effect
    this.addEffect({
      id: 'beatFlash',
      name: 'Beat Flash',
      enabled: true,
      intensity: 0.8,
      trigger: 'beat',
      threshold: 0.3,
      apply: (ctx, audioData, beatData) => {
        if (beatData.isBeat) {
          this.beatFlashIntensity = beatData.confidence * this.getEffect('beatFlash')!.intensity;
          this.lastBeatTime = Date.now();
        }
        
        // Fade out flash
        const timeSinceBeat = Date.now() - this.lastBeatTime;
        const fadeTime = 200; // ms
        const alpha = Math.max(0, 1 - timeSinceBeat / fadeTime);
        
        if (alpha > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = `rgba(255, 255, 255, ${this.beatFlashIntensity * alpha * 0.3})`;
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.restore();
        }
      }
    });

    // Color Shift Effect
    this.addEffect({
      id: 'colorShift',
      name: 'Color Shift',
      enabled: true,
      intensity: 0.6,
      trigger: 'continuous',
      threshold: 0,
      apply: (ctx, audioData, beatData, deltaTime) => {
        this.colorShiftPhase += deltaTime * 0.001 * audioData.volume * this.getEffect('colorShift')!.intensity;
        
        const hue = (this.colorShiftPhase * 360) % 360;
        const saturation = 50 + audioData.volume * 50;
        const lightness = 40 + audioData.volume * 30;
        
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.1)`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }
    });

    // Pulse Effect
    this.addEffect({
      id: 'pulse',
      name: 'Pulse Scale',
      enabled: true,
      intensity: 0.5,
      trigger: 'beat',
      threshold: 0.2,
      apply: (ctx, audioData, beatData) => {
        const targetScale = 1 + (audioData.bass * this.getEffect('pulse')!.intensity * 0.2);
        this.pulseScale += (targetScale - this.pulseScale) * 0.1;
        
        if (this.pulseScale !== 1) {
          const centerX = ctx.canvas.width / 2;
          const centerY = ctx.canvas.height / 2;
          
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(this.pulseScale, this.pulseScale);
          ctx.translate(-centerX, -centerY);
        }
      }
    });

    // Rotation Effect
    this.addEffect({
      id: 'rotation',
      name: 'Rotation',
      enabled: false,
      intensity: 0.3,
      trigger: 'continuous',
      threshold: 0,
      apply: (ctx, audioData, beatData, deltaTime) => {
        this.rotationAngle += deltaTime * 0.001 * audioData.volume * this.getEffect('rotation')!.intensity;
        
        if (this.rotationAngle !== 0) {
          const centerX = ctx.canvas.width / 2;
          const centerY = ctx.canvas.height / 2;
          
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(this.rotationAngle);
          ctx.translate(-centerX, -centerY);
        }
      }
    });

    // Glitch Effect
    this.addEffect({
      id: 'glitch',
      name: 'Glitch',
      enabled: false,
      intensity: 0.4,
      trigger: 'beat',
      threshold: 0.5,
      apply: (ctx, audioData, beatData) => {
        if (beatData.isBeat && beatData.confidence > this.getEffect('glitch')!.threshold) {
          const intensity = this.getEffect('glitch')!.intensity;
          this.glitchOffset.x = (Math.random() - 0.5) * 20 * intensity;
          this.glitchOffset.y = (Math.random() - 0.5) * 20 * intensity;
          
          // RGB channel separation
          const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < intensity * 0.1) {
              // Red channel shift
              const redIndex = i + Math.floor((Math.random() - 0.5) * 40) * 4;
              if (redIndex >= 0 && redIndex < data.length) {
                data[i] = data[redIndex];
              }
              
              // Blue channel shift
              const blueIndex = i + Math.floor((Math.random() - 0.5) * 40) * 4 + 2;
              if (blueIndex >= 0 && blueIndex < data.length) {
                data[i + 2] = data[blueIndex];
              }
            }
          }
          
          ctx.putImageData(imageData, this.glitchOffset.x, this.glitchOffset.y);
        }
        
        // Fade glitch offset
        this.glitchOffset.x *= 0.9;
        this.glitchOffset.y *= 0.9;
      }
    });

    // Trail Effect
    this.addEffect({
      id: 'trail',
      name: 'Motion Trail',
      enabled: true,
      intensity: 0.7,
      trigger: 'continuous',
      threshold: 0,
      apply: (ctx, audioData, beatData) => {
        const baseOpacity = 0.05;
        const volumeOpacity = audioData.volume * 0.1;
        this.trailOpacity = baseOpacity + volumeOpacity * this.getEffect('trail')!.intensity;
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.trailOpacity})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }
    });

    // Bloom Effect
    this.addEffect({
      id: 'bloom',
      name: 'Bloom',
      enabled: false,
      intensity: 0.5,
      trigger: 'treble',
      threshold: 0.3,
      apply: (ctx, audioData, beatData) => {
        if (audioData.treble > this.getEffect('bloom')!.threshold) {
          const intensity = this.getEffect('bloom')!.intensity;
          const bloomRadius = audioData.treble * intensity * 20;
          
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.filter = `blur(${bloomRadius}px)`;
          ctx.globalAlpha = 0.3;
          
          // Redraw current frame with blur for bloom effect
          const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.putImageData(imageData, 0, 0);
          
          ctx.restore();
        }
      }
    });

    // Kaleidoscope Effect
    this.addEffect({
      id: 'kaleidoscope',
      name: 'Kaleidoscope',
      enabled: false,
      intensity: 0.6,
      trigger: 'beat',
      threshold: 0.4,
      apply: (ctx, audioData, beatData) => {
        if (beatData.isBeat && beatData.confidence > this.getEffect('kaleidoscope')!.threshold) {
          const centerX = ctx.canvas.width / 2;
          const centerY = ctx.canvas.height / 2;
          const segments = 6;
          const intensity = this.getEffect('kaleidoscope')!.intensity;
          
          ctx.save();
          ctx.translate(centerX, centerY);
          
          for (let i = 0; i < segments; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI * 2) / segments);
            ctx.scale(1, i % 2 === 0 ? 1 : -1);
            ctx.globalAlpha = intensity * 0.3;
            
            // Draw a slice of the current canvas
            const sliceWidth = ctx.canvas.width / segments;
            ctx.drawImage(
              ctx.canvas,
              0, -centerY, sliceWidth, ctx.canvas.height,
              -sliceWidth/2, -centerY, sliceWidth, ctx.canvas.height
            );
            
            ctx.restore();
          }
          
          ctx.restore();
        }
      }
    });
  }

  addEffect(effect: VisualEffect): void {
    this.effects.set(effect.id, effect);
  }

  removeEffect(id: string): void {
    this.effects.delete(id);
  }

  getEffect(id: string): VisualEffect | undefined {
    return this.effects.get(id);
  }

  getAllEffects(): VisualEffect[] {
    return Array.from(this.effects.values());
  }

  enableEffect(id: string, enabled: boolean): void {
    const effect = this.effects.get(id);
    if (effect) {
      effect.enabled = enabled;
    }
  }

  setEffectIntensity(id: string, intensity: number): void {
    const effect = this.effects.get(id);
    if (effect) {
      effect.intensity = Math.max(0, Math.min(1, intensity));
    }
  }

  setEffectThreshold(id: string, threshold: number): void {
    const effect = this.effects.get(id);
    if (effect) {
      effect.threshold = Math.max(0, Math.min(1, threshold));
    }
  }

  applyEffects(
    ctx: CanvasRenderingContext2D,
    audioData: AudioAnalysisData,
    beatData: BeatData,
    deltaTime: number
  ): void {
    // Apply effects in order
    const effectOrder = ['trail', 'pulse', 'rotation', 'colorShift', 'beatFlash', 'glitch', 'bloom', 'kaleidoscope'];
    
    for (const effectId of effectOrder) {
      const effect = this.effects.get(effectId);
      if (!effect || !effect.enabled) continue;
      
      // Check if effect should trigger
      let shouldApply = false;
      
      switch (effect.trigger) {
        case 'beat':
          shouldApply = beatData.isBeat && beatData.confidence >= effect.threshold;
          break;
        case 'bass':
          shouldApply = audioData.bass >= effect.threshold;
          break;
        case 'mid':
          shouldApply = audioData.mid >= effect.threshold;
          break;
        case 'treble':
          shouldApply = audioData.treble >= effect.threshold;
          break;
        case 'volume':
          shouldApply = audioData.volume >= effect.threshold;
          break;
        case 'continuous':
          shouldApply = true;
          break;
      }
      
      if (shouldApply) {
        ctx.save();
        effect.apply(ctx, audioData, beatData, deltaTime);
        ctx.restore();
      }
    }
  }

  startColorTransition(from: string, to: string, duration: number, easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' = 'easeInOut'): void {
    this.activeTransitions.push({
      from,
      to,
      duration,
      startTime: Date.now(),
      easing,
    });
  }

  updateColorTransitions(): void {
    const currentTime = Date.now();
    
    this.activeTransitions = this.activeTransitions.filter(transition => {
      const elapsed = currentTime - transition.startTime;
      return elapsed < transition.duration;
    });
  }

  getCurrentTransitionColor(): string | null {
    if (this.activeTransitions.length === 0) return null;
    
    const transition = this.activeTransitions[0];
    const elapsed = Date.now() - transition.startTime;
    const progress = Math.min(1, elapsed / transition.duration);
    
    // Apply easing
    let easedProgress = progress;
    switch (transition.easing) {
      case 'easeIn':
        easedProgress = progress * progress;
        break;
      case 'easeOut':
        easedProgress = 1 - Math.pow(1 - progress, 2);
        break;
      case 'easeInOut':
        easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        break;
    }
    
    // Interpolate colors (simplified - assumes RGB hex colors)
    return this.interpolateColors(transition.from, transition.to, easedProgress);
  }

  private interpolateColors(from: string, to: string, progress: number): string {
    // Simple RGB interpolation (could be enhanced for HSL/HSV)
    const fromRGB = this.hexToRgb(from);
    const toRGB = this.hexToRgb(to);
    
    if (!fromRGB || !toRGB) return from;
    
    const r = Math.round(fromRGB.r + (toRGB.r - fromRGB.r) * progress);
    const g = Math.round(fromRGB.g + (toRGB.g - fromRGB.g) * progress);
    const b = Math.round(fromRGB.b + (toRGB.b - fromRGB.b) * progress);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  reset(): void {
    this.activeTransitions = [];
    this.lastBeatTime = 0;
    this.beatFlashIntensity = 0;
    this.colorShiftPhase = 0;
    this.pulseScale = 1;
    this.rotationAngle = 0;
    this.glitchOffset = { x: 0, y: 0 };
    this.trailOpacity = 0.1;
  }
}
