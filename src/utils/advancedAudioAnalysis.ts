import { AudioAnalysisData } from './audioAnalyzer';
import { BeatData } from './beatDetector';
import { MusicCharacteristics } from './storyThemeEngine';

export interface AdvancedAudioFeatures {
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  zeroCrossingRate: number;
  mfcc: number[]; // Mel-frequency cepstral coefficients
  chroma: number[]; // Chromagram features
  tonnetz: number[]; // Tonal centroid features
  harmonicRatio: number;
  percussiveRatio: number;
}

export interface MusicalStructure {
  sections: MusicalSection[];
  currentSection: MusicalSection | null;
  transitions: StructuralTransition[];
  overallStructure: 'verse-chorus' | 'aba' | 'through-composed' | 'unknown';
}

export interface MusicalSection {
  id: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'instrumental' | 'breakdown';
  startTime: number;
  endTime: number;
  energy: number;
  complexity: number;
  characteristics: string[];
}

export interface StructuralTransition {
  fromSection: string;
  toSection: string;
  time: number;
  type: 'gradual' | 'sudden' | 'build-up' | 'drop';
  intensity: number;
}

export interface GenreClassification {
  primary: string;
  confidence: number;
  secondary: string[];
  characteristics: {
    electronic: number;
    acoustic: number;
    vocal: number;
    instrumental: number;
    rhythmic: number;
    melodic: number;
  };
}

export class AdvancedAudioAnalyzer {
  private sampleRate: number = 44100;
  private frameSize: number = 2048;
  private hopSize: number = 512;
  private analysisHistory: AdvancedAudioFeatures[] = [];
  private structureAnalysis: MusicalStructure;
  private genreClassifier: GenreClassifier;
  
  constructor() {
    this.structureAnalysis = {
      sections: [],
      currentSection: null,
      transitions: [],
      overallStructure: 'unknown'
    };
    this.genreClassifier = new GenreClassifier();
  }

  analyzeAdvancedFeatures(
    audioData: AudioAnalysisData,
    beatData: BeatData,
    timeData: Uint8Array,
    frequencyData: Uint8Array
  ): AdvancedAudioFeatures {
    const features: AdvancedAudioFeatures = {
      spectralCentroid: this.calculateSpectralCentroid(frequencyData),
      spectralRolloff: this.calculateSpectralRolloff(frequencyData),
      spectralFlux: this.calculateSpectralFlux(frequencyData),
      zeroCrossingRate: this.calculateZeroCrossingRate(timeData),
      mfcc: this.calculateMFCC(frequencyData),
      chroma: this.calculateChroma(frequencyData),
      tonnetz: this.calculateTonnetz(frequencyData),
      harmonicRatio: this.calculateHarmonicRatio(frequencyData),
      percussiveRatio: this.calculatePercussiveRatio(frequencyData, beatData)
    };

    this.analysisHistory.push(features);
    if (this.analysisHistory.length > 1000) {
      this.analysisHistory.shift();
    }

    return features;
  }

  private calculateSpectralCentroid(frequencyData: Uint8Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i] / 255;
      const frequency = (i * this.sampleRate) / (2 * frequencyData.length);
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private calculateSpectralRolloff(frequencyData: Uint8Array, threshold: number = 0.85): number {
    const totalEnergy = frequencyData.reduce((sum, val) => sum + (val / 255) ** 2, 0);
    const targetEnergy = totalEnergy * threshold;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      cumulativeEnergy += (frequencyData[i] / 255) ** 2;
      if (cumulativeEnergy >= targetEnergy) {
        return (i * this.sampleRate) / (2 * frequencyData.length);
      }
    }
    
    return this.sampleRate / 2;
  }

  private calculateSpectralFlux(frequencyData: Uint8Array): number {
    if (this.analysisHistory.length === 0) return 0;
    
    const previousSpectrum = this.analysisHistory[this.analysisHistory.length - 1];
    if (!previousSpectrum) return 0;

    let flux = 0;
    const minLength = Math.min(frequencyData.length, 128); // Simplified for performance
    
    for (let i = 0; i < minLength; i++) {
      const current = frequencyData[i] / 255;
      const previous = i < previousSpectrum.mfcc.length ? previousSpectrum.mfcc[i] : 0;
      flux += Math.max(0, current - previous);
    }
    
    return flux / minLength;
  }

  private calculateZeroCrossingRate(timeData: Uint8Array): number {
    let crossings = 0;
    const centerValue = 128;
    
    for (let i = 1; i < timeData.length; i++) {
      const prev = timeData[i - 1] - centerValue;
      const curr = timeData[i] - centerValue;
      
      if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
        crossings++;
      }
    }
    
    return crossings / timeData.length;
  }

  private calculateMFCC(frequencyData: Uint8Array): number[] {
    // Simplified MFCC calculation
    const numCoefficients = 13;
    const mfcc: number[] = [];
    
    // Convert to mel scale and apply DCT (simplified)
    const melFilters = this.createMelFilterBank(frequencyData.length, numCoefficients);
    
    for (let i = 0; i < numCoefficients; i++) {
      let coefficient = 0;
      for (let j = 0; j < frequencyData.length; j++) {
        coefficient += (frequencyData[j] / 255) * melFilters[i][j];
      }
      mfcc.push(Math.log(coefficient + 1e-10));
    }
    
    return mfcc;
  }

  private createMelFilterBank(spectrumLength: number, numFilters: number): number[][] {
    const filters: number[][] = [];
    const melMax = this.hzToMel(this.sampleRate / 2);
    const melMin = this.hzToMel(0);
    
    for (let i = 0; i < numFilters; i++) {
      const filter = new Array(spectrumLength).fill(0);
      const centerMel = melMin + (i + 1) * (melMax - melMin) / (numFilters + 1);
      const centerHz = this.melToHz(centerMel);
      const centerBin = Math.floor((centerHz * spectrumLength * 2) / this.sampleRate);
      
      // Triangular filter
      const width = Math.floor(spectrumLength / numFilters);
      for (let j = Math.max(0, centerBin - width); j < Math.min(spectrumLength, centerBin + width); j++) {
        filter[j] = 1 - Math.abs(j - centerBin) / width;
      }
      
      filters.push(filter);
    }
    
    return filters;
  }

  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  private calculateChroma(frequencyData: Uint8Array): number[] {
    const chroma = new Array(12).fill(0);
    const A4_FREQ = 440;
    
    for (let i = 1; i < frequencyData.length; i++) {
      const frequency = (i * this.sampleRate) / (2 * frequencyData.length);
      const magnitude = frequencyData[i] / 255;
      
      if (frequency > 80 && frequency < 5000) { // Focus on musical range
        const pitchClass = Math.round(12 * Math.log2(frequency / A4_FREQ)) % 12;
        const normalizedPitchClass = pitchClass < 0 ? pitchClass + 12 : pitchClass;
        chroma[normalizedPitchClass] += magnitude;
      }
    }
    
    // Normalize
    const sum = chroma.reduce((a, b) => a + b, 0);
    return sum > 0 ? chroma.map(val => val / sum) : chroma;
  }

  private calculateTonnetz(frequencyData: Uint8Array): number[] {
    const chroma = this.calculateChroma(frequencyData);
    const tonnetz: number[] = [];
    
    // Calculate tonal centroid features (simplified)
    const majorThird = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]; // C-E-G#
    const minorThird = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]; // C-Eb-Gb
    const perfectFifth = [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]; // C-G
    
    tonnetz.push(this.dotProduct(chroma, majorThird));
    tonnetz.push(this.dotProduct(chroma, minorThird));
    tonnetz.push(this.dotProduct(chroma, perfectFifth));
    
    return tonnetz;
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private calculateHarmonicRatio(frequencyData: Uint8Array): number {
    // Simplified harmonic analysis
    let harmonicEnergy = 0;
    let totalEnergy = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = (frequencyData[i] / 255) ** 2;
      totalEnergy += magnitude;
      
      // Check if frequency is likely harmonic (simplified)
      const frequency = (i * this.sampleRate) / (2 * frequencyData.length);
      if (this.isLikelyHarmonic(frequency)) {
        harmonicEnergy += magnitude;
      }
    }
    
    return totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
  }

  private isLikelyHarmonic(frequency: number): boolean {
    // Simplified harmonic detection
    const fundamentalFreqs = [82, 110, 147, 196, 247, 330, 440, 587, 784]; // Musical notes
    
    for (const fundamental of fundamentalFreqs) {
      for (let harmonic = 1; harmonic <= 8; harmonic++) {
        const harmonicFreq = fundamental * harmonic;
        if (Math.abs(frequency - harmonicFreq) < 10) {
          return true;
        }
      }
    }
    
    return false;
  }

  private calculatePercussiveRatio(frequencyData: Uint8Array, beatData: BeatData): number {
    // Combine spectral flux with beat confidence
    const spectralFlux = this.calculateSpectralFlux(frequencyData);
    const beatConfidence = beatData.confidence || 0;
    
    // High frequency energy often indicates percussive content
    let highFreqEnergy = 0;
    const startIdx = Math.floor(frequencyData.length * 0.7); // Upper 30% of spectrum
    
    for (let i = startIdx; i < frequencyData.length; i++) {
      highFreqEnergy += (frequencyData[i] / 255) ** 2;
    }
    
    const normalizedHighFreq = highFreqEnergy / (frequencyData.length - startIdx);
    
    return (spectralFlux * 0.4 + beatConfidence * 0.4 + normalizedHighFreq * 0.2);
  }

  generateMusicCharacteristics(
    audioData: AudioAnalysisData,
    beatData: BeatData,
    advancedFeatures: AdvancedAudioFeatures
  ): MusicCharacteristics {
    const genre = this.genreClassifier.classify(advancedFeatures, audioData, beatData);
    
    return {
      tempo: beatData.tempo || 120,
      energy: (audioData.bass + audioData.mid + audioData.treble) / 3,
      valence: this.calculateValence(advancedFeatures, audioData),
      danceability: this.calculateDanceability(beatData, advancedFeatures),
      acousticness: this.calculateAcousticness(advancedFeatures),
      instrumentalness: this.calculateInstrumentalness(advancedFeatures),
      genre: genre.primary,
      mood: this.detectMood(advancedFeatures, audioData),
      timeSignature: beatData.timeSignature || 4,
      key: this.detectKey(advancedFeatures.chroma)
    };
  }

  private calculateValence(features: AdvancedAudioFeatures, audioData: AudioAnalysisData): number {
    // Major keys and higher spectral centroid suggest positive valence
    const majorKeyStrength = this.getMajorKeyStrength(features.chroma);
    const brightness = features.spectralCentroid / 5000; // Normalize to 0-1
    const harmonicity = features.harmonicRatio;
    
    return Math.min(1, (majorKeyStrength * 0.4 + brightness * 0.3 + harmonicity * 0.3));
  }

  private getMajorKeyStrength(chroma: number[]): number {
    const majorProfile = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]; // Major scale
    return this.dotProduct(chroma, majorProfile) / majorProfile.reduce((a, b) => a + b, 0);
  }

  private calculateDanceability(beatData: BeatData, features: AdvancedAudioFeatures): number {
    const rhythmStrength = beatData.confidence || 0.5;
    const percussiveness = features.percussiveRatio;
    const regularity = 1 - features.spectralFlux; // More regular = more danceable
    
    return Math.min(1, (rhythmStrength * 0.5 + percussiveness * 0.3 + regularity * 0.2));
  }

  private calculateAcousticness(features: AdvancedAudioFeatures): number {
    // Lower spectral centroid and higher harmonic ratio suggest acoustic
    const lowFreqBias = 1 - (features.spectralCentroid / 5000);
    const harmonicity = features.harmonicRatio;
    const naturalness = 1 - features.spectralFlux; // Less variation = more acoustic
    
    return Math.min(1, (lowFreqBias * 0.4 + harmonicity * 0.4 + naturalness * 0.2));
  }

  private calculateInstrumentalness(features: AdvancedAudioFeatures): number {
    // Lower zero crossing rate and specific MFCC patterns suggest instrumental
    const lowZCR = 1 - features.zeroCrossingRate;
    const mfccVariance = this.calculateVariance(features.mfcc);
    const consistency = 1 - mfccVariance;
    
    return Math.min(1, (lowZCR * 0.6 + consistency * 0.4));
  }

  private calculateVariance(array: number[]): number {
    const mean = array.reduce((a, b) => a + b, 0) / array.length;
    const variance = array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / array.length;
    return Math.sqrt(variance);
  }

  private detectMood(features: AdvancedAudioFeatures, audioData: AudioAnalysisData): MusicCharacteristics['mood'] {
    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const valence = this.calculateValence(features, audioData);
    const spectralCentroid = features.spectralCentroid;
    
    if (energy > 0.7 && valence > 0.6) return 'energetic';
    if (energy < 0.4 && valence > 0.5) return 'calm';
    if (valence < 0.3 || spectralCentroid < 1000) return 'dark';
    if (valence > 0.7 && spectralCentroid > 2000) return 'uplifting';
    if (energy < 0.5 && valence < 0.5) return 'mysterious';
    if (valence > 0.6 && energy < 0.6) return 'romantic';
    if (energy > 0.8 && features.percussiveRatio > 0.7) return 'aggressive';
    
    return 'calm';
  }

  private detectKey(chroma: number[]): string {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let maxCorrelation = -1;
    let detectedKey = 'C';
    
    const majorProfile = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
    
    for (let i = 0; i < 12; i++) {
      const rotatedProfile = [...majorProfile.slice(i), ...majorProfile.slice(0, i)];
      const correlation = this.dotProduct(chroma, rotatedProfile);
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        detectedKey = keys[i];
      }
    }
    
    return detectedKey;
  }
}

class GenreClassifier {
  classify(
    features: AdvancedAudioFeatures,
    audioData: AudioAnalysisData,
    beatData: BeatData
  ): GenreClassification {
    const characteristics = {
      electronic: this.calculateElectronicScore(features, audioData),
      acoustic: this.calculateAcousticScore(features),
      vocal: this.calculateVocalScore(features),
      instrumental: this.calculateInstrumentalScore(features),
      rhythmic: this.calculateRhythmicScore(beatData, features),
      melodic: this.calculateMelodicScore(features)
    };

    // Simple genre classification based on characteristics
    let primary = 'unknown';
    let confidence = 0;

    if (characteristics.electronic > 0.7 && characteristics.rhythmic > 0.6) {
      primary = 'electronic';
      confidence = (characteristics.electronic + characteristics.rhythmic) / 2;
    } else if (characteristics.acoustic > 0.6 && characteristics.melodic > 0.5) {
      primary = 'folk';
      confidence = (characteristics.acoustic + characteristics.melodic) / 2;
    } else if (characteristics.rhythmic > 0.8 && beatData.tempo > 120) {
      primary = 'dance';
      confidence = characteristics.rhythmic;
    } else if (characteristics.instrumental > 0.7 && characteristics.melodic > 0.6) {
      primary = 'ambient';
      confidence = (characteristics.instrumental + characteristics.melodic) / 2;
    }

    return {
      primary,
      confidence,
      secondary: this.getSecondaryGenres(characteristics),
      characteristics
    };
  }

  private calculateElectronicScore(features: AdvancedAudioFeatures, audioData: AudioAnalysisData): number {
    const highFreqEnergy = audioData.treble;
    const spectralFlux = features.spectralFlux;
    const lowHarmonicRatio = 1 - features.harmonicRatio;
    
    return (highFreqEnergy * 0.4 + spectralFlux * 0.3 + lowHarmonicRatio * 0.3);
  }

  private calculateAcousticScore(features: AdvancedAudioFeatures): number {
    return features.harmonicRatio * 0.6 + (1 - features.spectralFlux) * 0.4;
  }

  private calculateVocalScore(features: AdvancedAudioFeatures): number {
    // Vocal content typically has specific MFCC patterns and zero crossing rates
    const midRangeZCR = features.zeroCrossingRate > 0.1 && features.zeroCrossingRate < 0.3 ? 1 : 0;
    const mfccVariance = this.calculateMFCCVariance(features.mfcc);
    
    return midRangeZCR * 0.6 + mfccVariance * 0.4;
  }

  private calculateInstrumentalScore(features: AdvancedAudioFeatures): number {
    return 1 - this.calculateVocalScore(features);
  }

  private calculateRhythmicScore(beatData: BeatData, features: AdvancedAudioFeatures): number {
    const beatStrength = beatData.confidence || 0;
    const percussiveness = features.percussiveRatio;
    
    return (beatStrength * 0.7 + percussiveness * 0.3);
  }

  private calculateMelodicScore(features: AdvancedAudioFeatures): number {
    const harmonicity = features.harmonicRatio;
    const tonalStability = this.calculateTonalStability(features.chroma);
    
    return (harmonicity * 0.6 + tonalStability * 0.4);
  }

  private calculateMFCCVariance(mfcc: number[]): number {
    const mean = mfcc.reduce((a, b) => a + b, 0) / mfcc.length;
    const variance = mfcc.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / mfcc.length;
    return Math.min(1, Math.sqrt(variance));
  }

  private calculateTonalStability(chroma: number[]): number {
    // Higher values in fewer chroma bins suggest more tonal stability
    const maxChroma = Math.max(...chroma);
    const chromaSum = chroma.reduce((a, b) => a + b, 0);
    
    return chromaSum > 0 ? maxChroma / chromaSum : 0;
  }

  private getSecondaryGenres(characteristics: any): string[] {
    const genres: string[] = [];
    const threshold = 0.5;
    
    if (characteristics.electronic > threshold) genres.push('electronic');
    if (characteristics.acoustic > threshold) genres.push('acoustic');
    if (characteristics.rhythmic > threshold) genres.push('rhythmic');
    if (characteristics.melodic > threshold) genres.push('melodic');
    
    return genres.slice(0, 3); // Return top 3 secondary genres
  }
}
