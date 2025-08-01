export interface BeatData {
  isBeat: boolean;
  confidence: number;
  tempo: number;
  timeSignature: number;
  beatPhase: number; // 0-1, position within the beat
  intensity: number;
}

export interface RhythmPattern {
  pattern: boolean[];
  confidence: number;
  period: number;
}

export class AdvancedBeatDetector {
  private sampleRate: number;
  private bufferSize: number;
  private energyHistory: number[] = [];
  private beatHistory: number[] = [];
  private tempoHistory: number[] = [];
  private lastBeatTime = 0;
  private beatInterval = 0;
  private beatPhase = 0;
  
  // Advanced detection parameters
  private energyThreshold = 1.3;
  private minBeatInterval = 300; // ms
  private maxBeatInterval = 2000; // ms
  private historySize = 43; // ~1 second at 43 FPS
  private tempoSmoothingFactor = 0.9;
  
  // Frequency band analysis
  private bassHistory: number[] = [];
  private midHistory: number[] = [];
  private trebleHistory: number[] = [];
  
  // Pattern recognition
  private rhythmPatterns: RhythmPattern[] = [];
  private patternBuffer: boolean[] = [];
  
  constructor(sampleRate = 44100, bufferSize = 1024) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
  }

  analyze(
    frequencyData: Uint8Array,
    timeData: Uint8Array,
    bass: number,
    mid: number,
    treble: number
  ): BeatData {
    const currentTime = Date.now();
    
    // Calculate total energy
    const energy = this.calculateEnergy(frequencyData);
    
    // Update frequency band histories
    this.updateFrequencyHistories(bass, mid, treble);
    
    // Update energy history
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
    
    // Detect beat
    const beatResult = this.detectBeat(energy, currentTime);
    
    // Update tempo
    const tempo = this.calculateTempo(currentTime, beatResult.isBeat);
    
    // Calculate beat phase
    this.updateBeatPhase(currentTime, tempo);
    
    // Analyze rhythm patterns
    this.updateRhythmPatterns(beatResult.isBeat);
    
    // Calculate time signature (simplified)
    const timeSignature = this.estimateTimeSignature();
    
    return {
      isBeat: beatResult.isBeat,
      confidence: beatResult.confidence,
      tempo,
      timeSignature,
      beatPhase: this.beatPhase,
      intensity: this.calculateIntensity(bass, mid, treble, energy),
    };
  }

  private calculateEnergy(frequencyData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i] * frequencyData[i];
    }
    return Math.sqrt(sum / frequencyData.length) / 255;
  }

  private updateFrequencyHistories(bass: number, mid: number, treble: number): void {
    this.bassHistory.push(bass);
    this.midHistory.push(mid);
    this.trebleHistory.push(treble);
    
    const maxHistory = 20;
    if (this.bassHistory.length > maxHistory) this.bassHistory.shift();
    if (this.midHistory.length > maxHistory) this.midHistory.shift();
    if (this.trebleHistory.length > maxHistory) this.trebleHistory.shift();
  }

  private detectBeat(energy: number, currentTime: number): { isBeat: boolean; confidence: number } {
    if (this.energyHistory.length < 10) {
      return { isBeat: false, confidence: 0 };
    }
    
    // Calculate local energy average
    const recentEnergy = this.energyHistory.slice(-10);
    const localAverage = recentEnergy.reduce((sum, val) => sum + val, 0) / recentEnergy.length;
    
    // Calculate variance for adaptive threshold
    const variance = recentEnergy.reduce((sum, val) => sum + Math.pow(val - localAverage, 2), 0) / recentEnergy.length;
    const adaptiveThreshold = this.energyThreshold + Math.sqrt(variance);
    
    // Check if current energy exceeds threshold
    const energyRatio = energy / (localAverage + 0.001);
    const isEnergyBeat = energyRatio > adaptiveThreshold;
    
    // Check timing constraints
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    const isTimingValid = timeSinceLastBeat >= this.minBeatInterval;
    
    // Multi-band beat detection
    const bassAvg = this.bassHistory.reduce((sum, val) => sum + val, 0) / this.bassHistory.length;
    const isBassHit = this.bassHistory[this.bassHistory.length - 1] > bassAvg * 1.2;
    
    // Combine criteria
    const isBeat = isEnergyBeat && isTimingValid && isBassHit;
    
    // Calculate confidence
    let confidence = 0;
    if (isBeat) {
      confidence = Math.min(1, (energyRatio - 1) * 0.5);
      this.lastBeatTime = currentTime;
      this.beatHistory.push(currentTime);
      
      // Limit beat history
      if (this.beatHistory.length > 8) {
        this.beatHistory.shift();
      }
    }
    
    return { isBeat, confidence };
  }

  private calculateTempo(currentTime: number, isBeat: boolean): number {
    if (!isBeat || this.beatHistory.length < 2) {
      return this.tempoHistory.length > 0 ? 
        this.tempoHistory[this.tempoHistory.length - 1] : 120;
    }
    
    // Calculate intervals between recent beats
    const intervals: number[] = [];
    for (let i = 1; i < this.beatHistory.length; i++) {
      intervals.push(this.beatHistory[i] - this.beatHistory[i - 1]);
    }
    
    // Filter out outliers
    const medianInterval = this.median(intervals);
    const validIntervals = intervals.filter(interval => 
      Math.abs(interval - medianInterval) < medianInterval * 0.3
    );
    
    if (validIntervals.length === 0) return 120;
    
    // Calculate average interval
    const avgInterval = validIntervals.reduce((sum, val) => sum + val, 0) / validIntervals.length;
    
    // Convert to BPM
    const newTempo = Math.round(60000 / avgInterval);
    
    // Smooth tempo changes
    const lastTempo = this.tempoHistory.length > 0 ? 
      this.tempoHistory[this.tempoHistory.length - 1] : newTempo;
    
    const smoothedTempo = Math.round(
      lastTempo * this.tempoSmoothingFactor + 
      newTempo * (1 - this.tempoSmoothingFactor)
    );
    
    // Validate tempo range
    const finalTempo = Math.max(60, Math.min(200, smoothedTempo));
    
    this.tempoHistory.push(finalTempo);
    if (this.tempoHistory.length > 10) {
      this.tempoHistory.shift();
    }
    
    return finalTempo;
  }

  private updateBeatPhase(currentTime: number, tempo: number): void {
    if (this.lastBeatTime === 0) {
      this.beatPhase = 0;
      return;
    }
    
    const beatDuration = 60000 / tempo; // ms per beat
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    this.beatPhase = (timeSinceLastBeat % beatDuration) / beatDuration;
  }

  private updateRhythmPatterns(isBeat: boolean): void {
    this.patternBuffer.push(isBeat);
    
    // Keep pattern buffer at reasonable size
    if (this.patternBuffer.length > 32) {
      this.patternBuffer.shift();
    }
    
    // Analyze patterns every 16 beats
    if (this.patternBuffer.length >= 16 && this.patternBuffer.length % 16 === 0) {
      this.analyzeRhythmPatterns();
    }
  }

  private analyzeRhythmPatterns(): void {
    const patternLengths = [4, 8, 16];
    
    for (const length of patternLengths) {
      if (this.patternBuffer.length < length * 2) continue;
      
      const pattern = this.patternBuffer.slice(-length);
      const confidence = this.calculatePatternConfidence(pattern, length);
      
      if (confidence > 0.6) {
        // Update or add pattern
        const existingPattern = this.rhythmPatterns.find(p => 
          p.period === length && this.patternsMatch(p.pattern, pattern)
        );
        
        if (existingPattern) {
          existingPattern.confidence = Math.min(1, existingPattern.confidence + 0.1);
        } else {
          this.rhythmPatterns.push({
            pattern: [...pattern],
            confidence,
            period: length,
          });
        }
      }
    }
    
    // Clean up weak patterns
    this.rhythmPatterns = this.rhythmPatterns.filter(p => p.confidence > 0.3);
    
    // Limit number of patterns
    if (this.rhythmPatterns.length > 5) {
      this.rhythmPatterns.sort((a, b) => b.confidence - a.confidence);
      this.rhythmPatterns = this.rhythmPatterns.slice(0, 5);
    }
  }

  private calculatePatternConfidence(pattern: boolean[], length: number): number {
    if (this.patternBuffer.length < length * 3) return 0;
    
    let matches = 0;
    let total = 0;
    
    // Check how well the pattern repeats
    for (let i = length; i < this.patternBuffer.length - length; i += length) {
      for (let j = 0; j < length; j++) {
        if (this.patternBuffer[i + j] === pattern[j]) {
          matches++;
        }
        total++;
      }
    }
    
    return total > 0 ? matches / total : 0;
  }

  private patternsMatch(pattern1: boolean[], pattern2: boolean[]): boolean {
    if (pattern1.length !== pattern2.length) return false;
    
    let matches = 0;
    for (let i = 0; i < pattern1.length; i++) {
      if (pattern1[i] === pattern2[i]) matches++;
    }
    
    return matches / pattern1.length > 0.8;
  }

  private estimateTimeSignature(): number {
    // Simplified time signature detection
    const strongPatterns = this.rhythmPatterns.filter(p => p.confidence > 0.7);
    
    if (strongPatterns.length === 0) return 4;
    
    // Look for common time signatures based on pattern periods
    const periods = strongPatterns.map(p => p.period);
    
    if (periods.includes(4) || periods.includes(8)) return 4;
    if (periods.includes(3) || periods.includes(6)) return 3;
    if (periods.includes(2)) return 2;
    
    return 4; // Default to 4/4
  }

  private calculateIntensity(bass: number, mid: number, treble: number, energy: number): number {
    // Weighted combination of frequency bands and overall energy
    return Math.min(1, (bass * 0.4 + mid * 0.3 + treble * 0.2 + energy * 0.1) * 2);
  }

  private median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  getRhythmPatterns(): RhythmPattern[] {
    return [...this.rhythmPatterns];
  }

  reset(): void {
    this.energyHistory = [];
    this.beatHistory = [];
    this.tempoHistory = [];
    this.bassHistory = [];
    this.midHistory = [];
    this.trebleHistory = [];
    this.rhythmPatterns = [];
    this.patternBuffer = [];
    this.lastBeatTime = 0;
    this.beatPhase = 0;
  }
}
