export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  beat: boolean;
  tempo: number;
}

export interface AudioAnalyzerConfig {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext;
  private analyzerNode: AnalyserNode;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private audioBuffer: AudioBuffer | null = null;
  
  // Beat detection properties
  private beatHistory: number[] = [];
  private lastBeatTime = 0;
  private beatThreshold = 0.3;
  private tempoHistory: number[] = [];
  
  // Analysis data arrays
  private frequencyData: Uint8Array;
  private timeData: Uint8Array;
  
  constructor(config: Partial<AudioAnalyzerConfig> = {}) {
    const defaultConfig: AudioAnalyzerConfig = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyzerNode = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();
    
    // Configure analyzer
    this.analyzerNode.fftSize = finalConfig.fftSize;
    this.analyzerNode.smoothingTimeConstant = finalConfig.smoothingTimeConstant;
    this.analyzerNode.minDecibels = finalConfig.minDecibels;
    this.analyzerNode.maxDecibels = finalConfig.maxDecibels;
    
    // Initialize data arrays
    this.frequencyData = new Uint8Array(this.analyzerNode.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyzerNode.frequencyBinCount);
    
    // Connect nodes
    this.gainNode.connect(this.analyzerNode);
    this.analyzerNode.connect(this.audioContext.destination);
  }

  async loadAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
    this.audioBuffer = audioBuffer;
    await this.audioContext.resume();
  }

  play(startOffset = 0): void {
    if (!this.audioBuffer) return;
    
    this.stop();
    
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);
    
    this.sourceNode.start(0, startOffset);
    this.startTime = this.audioContext.currentTime - startOffset;
    this.isPlaying = true;
    
    this.sourceNode.onended = () => {
      this.isPlaying = false;
    };
  }

  pause(): void {
    if (this.sourceNode && this.isPlaying) {
      this.pauseTime = this.getCurrentTime();
      this.sourceNode.stop();
      this.isPlaying = false;
    }
  }

  resume(): void {
    if (this.pauseTime > 0) {
      this.play(this.pauseTime);
      this.pauseTime = 0;
    }
  }

  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.pauseTime = 0;
  }

  setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseTime;
    return this.audioContext.currentTime - this.startTime;
  }

  getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  seekTo(time: number): void {
    if (!this.audioBuffer) return;
    
    const wasPlaying = this.isPlaying;
    this.stop();
    
    if (wasPlaying) {
      this.play(Math.max(0, Math.min(time, this.getDuration())));
    } else {
      this.pauseTime = Math.max(0, Math.min(time, this.getDuration()));
    }
  }

  getAnalysisData(): AudioAnalysisData {
    // Get frequency and time domain data
    this.analyzerNode.getByteFrequencyData(this.frequencyData);
    this.analyzerNode.getByteTimeDomainData(this.timeData);
    
    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const sample = (this.timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    const volume = Math.sqrt(sum / this.timeData.length);
    
    // Calculate frequency bands
    const bass = this.getFrequencyBandAverage(0, 60); // 0-60 Hz
    const mid = this.getFrequencyBandAverage(60, 250); // 60-250 Hz  
    const treble = this.getFrequencyBandAverage(250, 500); // 250Hz+
    
    // Beat detection
    const beat = this.detectBeat(bass, volume);
    const tempo = this.calculateTempo();
    
    return {
      frequencyData: this.frequencyData,
      timeData: this.timeData,
      volume,
      bass,
      mid,
      treble,
      beat,
      tempo,
    };
  }

  private getFrequencyBandAverage(startFreq: number, endFreq: number): number {
    const nyquist = this.audioContext.sampleRate / 2;
    const startBin = Math.floor((startFreq / nyquist) * this.frequencyData.length);
    const endBin = Math.floor((endFreq / nyquist) * this.frequencyData.length);
    
    let sum = 0;
    let count = 0;
    
    for (let i = startBin; i < Math.min(endBin, this.frequencyData.length); i++) {
      sum += this.frequencyData[i];
      count++;
    }
    
    return count > 0 ? sum / count / 255 : 0;
  }

  private detectBeat(bassLevel: number, volume: number): boolean {
    const currentTime = Date.now();
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    
    // Minimum time between beats (prevents false positives)
    if (timeSinceLastBeat < 100) return false;
    
    // Add current bass level to history
    this.beatHistory.push(bassLevel);
    if (this.beatHistory.length > 10) {
      this.beatHistory.shift();
    }
    
    // Calculate average bass level
    const avgBass = this.beatHistory.reduce((sum, val) => sum + val, 0) / this.beatHistory.length;
    
    // Beat detected if current bass is significantly higher than average
    const beatDetected = bassLevel > avgBass + this.beatThreshold && volume > 0.1;
    
    if (beatDetected) {
      this.lastBeatTime = currentTime;
      
      // Update tempo calculation
      if (this.tempoHistory.length > 0) {
        const lastBeatInterval = timeSinceLastBeat;
        this.tempoHistory.push(lastBeatInterval);
        if (this.tempoHistory.length > 8) {
          this.tempoHistory.shift();
        }
      } else {
        this.tempoHistory.push(timeSinceLastBeat);
      }
    }
    
    return beatDetected;
  }

  private calculateTempo(): number {
    if (this.tempoHistory.length < 2) return 0;
    
    // Calculate average interval between beats
    const avgInterval = this.tempoHistory.reduce((sum, val) => sum + val, 0) / this.tempoHistory.length;
    
    // Convert to BPM
    return Math.round(60000 / avgInterval);
  }

  isPlayingAudio(): boolean {
    return this.isPlaying;
  }

  destroy(): void {
    this.stop();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
