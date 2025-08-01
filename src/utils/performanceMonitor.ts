export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  audioLatency: number;
  renderTime: number;
  isOptimal: boolean;
}

export interface PerformanceSettings {
  targetFPS: number;
  maxFrameTime: number;
  enableAdaptiveQuality: boolean;
  enableMemoryMonitoring: boolean;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private frameTimeHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  private fps = 0;
  private settings: PerformanceSettings;
  private isMonitoring = false;
  private onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  
  // Adaptive quality settings
  private currentQuality = 1.0;
  private qualityAdjustmentCooldown = 0;
  private lastQualityAdjustment = 0;

  constructor(settings: Partial<PerformanceSettings> = {}) {
    this.settings = {
      targetFPS: 60,
      maxFrameTime: 16.67, // ~60fps
      enableAdaptiveQuality: true,
      enableMemoryMonitoring: true,
      ...settings,
    };
  }

  start(): void {
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.frameTimeHistory = [];
    this.renderTimeHistory = [];
  }

  stop(): void {
    this.isMonitoring = false;
  }

  recordFrame(renderStartTime?: number): PerformanceMetrics {
    if (!this.isMonitoring) {
      return this.getDefaultMetrics();
    }

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;
    
    // Record render time if provided
    const renderTime = renderStartTime ? currentTime - renderStartTime : 0;
    
    this.frameTimeHistory.push(frameTime);
    if (renderStartTime) {
      this.renderTimeHistory.push(renderTime);
    }
    
    // Keep history size manageable
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }
    if (this.renderTimeHistory.length > 60) {
      this.renderTimeHistory.shift();
    }
    
    this.frameCount++;
    
    // Calculate FPS every second
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    const metrics = this.calculateMetrics(frameTime, renderTime);
    
    // Adaptive quality adjustment
    if (this.settings.enableAdaptiveQuality) {
      this.adjustQuality(metrics);
    }
    
    // Notify listeners
    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }
    
    return metrics;
  }

  private calculateMetrics(frameTime: number, renderTime: number): PerformanceMetrics {
    const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    const avgRenderTime = this.renderTimeHistory.length > 0 
      ? this.renderTimeHistory.reduce((sum, time) => sum + time, 0) / this.renderTimeHistory.length 
      : renderTime;

    // Estimate audio latency (simplified)
    const audioLatency = this.estimateAudioLatency();
    
    // Memory usage (if supported)
    let memoryUsage: number | undefined;
    if (this.settings.enableMemoryMonitoring && 'memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    
    // Determine if performance is optimal
    const isOptimal = this.fps >= this.settings.targetFPS * 0.9 && 
                     avgFrameTime <= this.settings.maxFrameTime * 1.1 &&
                     (memoryUsage === undefined || memoryUsage < 0.8);

    return {
      fps: this.fps,
      frameTime: avgFrameTime,
      memoryUsage,
      audioLatency,
      renderTime: avgRenderTime,
      isOptimal,
    };
  }

  private estimateAudioLatency(): number {
    // This is a simplified estimation
    // In a real implementation, you'd measure actual audio buffer latency
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const baseLatency = audioContext.baseLatency || 0;
      const outputLatency = audioContext.outputLatency || 0;
      audioContext.close();
      return (baseLatency + outputLatency) * 1000; // Convert to ms
    } catch {
      return 20; // Default estimate
    }
  }

  private adjustQuality(metrics: PerformanceMetrics): void {
    const currentTime = Date.now();
    
    // Cooldown period to prevent rapid adjustments
    if (currentTime - this.lastQualityAdjustment < 2000) {
      return;
    }
    
    const targetFPS = this.settings.targetFPS;
    const fpsRatio = metrics.fps / targetFPS;
    
    let newQuality = this.currentQuality;
    
    // Decrease quality if performance is poor
    if (fpsRatio < 0.8 && this.currentQuality > 0.3) {
      newQuality = Math.max(0.3, this.currentQuality - 0.1);
    }
    // Increase quality if performance is good
    else if (fpsRatio > 0.95 && this.currentQuality < 1.0) {
      newQuality = Math.min(1.0, this.currentQuality + 0.05);
    }
    
    if (newQuality !== this.currentQuality) {
      this.currentQuality = newQuality;
      this.lastQualityAdjustment = currentTime;
      
      // Notify about quality change
      this.onQualityChange?.(this.currentQuality);
    }
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      audioLatency: 0,
      renderTime: 0,
      isOptimal: true,
    };
  }

  getCurrentQuality(): number {
    return this.currentQuality;
  }

  setQuality(quality: number): void {
    this.currentQuality = Math.max(0.1, Math.min(1.0, quality));
    this.lastQualityAdjustment = Date.now();
  }

  onMetricsChange(callback: (metrics: PerformanceMetrics) => void): void {
    this.onMetricsUpdate = callback;
  }

  private onQualityChange?: (quality: number) => void;

  onQualityAdjustment(callback: (quality: number) => void): void {
    this.onQualityChange = callback;
  }

  getRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.fps < this.settings.targetFPS * 0.8) {
      recommendations.push('Consider reducing visualization complexity or particle count');
      recommendations.push('Try switching to a simpler visualization mode');
    }
    
    if (metrics.frameTime > this.settings.maxFrameTime * 1.5) {
      recommendations.push('Reduce effects intensity or disable some effects');
      recommendations.push('Lower the canvas resolution');
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 0.8) {
      recommendations.push('Reduce particle count or effect history');
      recommendations.push('Consider reloading the page to free memory');
    }
    
    if (metrics.audioLatency > 50) {
      recommendations.push('Audio latency is high - consider using a different audio device');
      recommendations.push('Close other audio applications');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal!');
    }
    
    return recommendations;
  }

  // Static utility methods
  static isHighPerformanceDevice(): boolean {
    // Simple heuristic based on available features and hardware
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return false;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Check for dedicated graphics cards
      if (renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Intel Iris')) {
        return true;
      }
    }
    
    // Check for other performance indicators
    return navigator.hardwareConcurrency >= 4 && 'memory' in performance;
  }

  static getOptimalSettings(): Partial<PerformanceSettings> {
    const isHighPerf = PerformanceMonitor.isHighPerformanceDevice();
    
    return {
      targetFPS: isHighPerf ? 60 : 30,
      maxFrameTime: isHighPerf ? 16.67 : 33.33,
      enableAdaptiveQuality: !isHighPerf,
      enableMemoryMonitoring: true,
    };
  }
}
