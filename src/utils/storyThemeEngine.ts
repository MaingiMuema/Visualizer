export interface MusicCharacteristics {
  tempo: number;
  energy: number;
  valence: number; // Musical positivity/negativity
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  genre: string;
  mood: 'energetic' | 'calm' | 'dark' | 'uplifting' | 'mysterious' | 'romantic' | 'aggressive';
  timeSignature: number;
  key: string;
}

export interface StoryTheme {
  id: string;
  name: string;
  description: string;
  mood: string[];
  tempoRange: [number, number];
  energyRange: [number, number];
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  environments: string[];
  characters: string[];
  objects: string[];
  atmospheres: string[];
  narrativeElements: {
    beginning: string[];
    middle: string[];
    climax: string[];
    resolution: string[];
  };
}

export interface StoryScene {
  id: string;
  themeId: string;
  name: string;
  description: string;
  duration: number;
  intensity: number;
  visualElements: {
    background: string;
    foreground: string[];
    particles: string[];
    lighting: string;
  };
  animations: {
    camera: string;
    objects: string[];
    transitions: string[];
  };
}

export class StoryThemeEngine {
  private themes: Map<string, StoryTheme> = new Map();
  private currentTheme: StoryTheme | null = null;
  private currentScene: StoryScene | null = null;
  private sceneHistory: StoryScene[] = [];
  private musicAnalysisHistory: MusicCharacteristics[] = [];

  constructor() {
    this.initializeThemes();
  }

  private initializeThemes(): void {
    // Space Odyssey Theme
    this.addTheme({
      id: 'space-odyssey',
      name: 'Space Odyssey',
      description: 'Journey through cosmic landscapes and stellar phenomena',
      mood: ['mysterious', 'uplifting', 'energetic'],
      tempoRange: [80, 140],
      energyRange: [0.4, 1.0],
      colors: {
        primary: ['#0a0a2e', '#16213e', '#1a1a3a'],
        secondary: ['#3b82f6', '#8b5cf6', '#06b6d4'],
        accent: ['#fbbf24', '#f59e0b', '#ffffff']
      },
      environments: [
        'nebula clouds', 'star fields', 'planetary rings', 'asteroid belts',
        'space stations', 'cosmic storms', 'black holes', 'galaxy spirals'
      ],
      characters: [
        'spacecraft', 'astronauts', 'alien vessels', 'space probes',
        'satellites', 'space debris', 'cosmic entities'
      ],
      objects: [
        'planets', 'moons', 'comets', 'meteors', 'space rocks',
        'energy beams', 'wormholes', 'pulsars', 'supernovas'
      ],
      atmospheres: [
        'weightless floating', 'cosmic wind', 'stellar radiation',
        'gravitational waves', 'quantum fluctuations', 'dark matter'
      ],
      narrativeElements: {
        beginning: ['launch sequence', 'leaving Earth orbit', 'first glimpse of deep space'],
        middle: ['navigating asteroid field', 'discovering new worlds', 'encountering phenomena'],
        climax: ['approaching black hole', 'stellar collision', 'alien contact'],
        resolution: ['safe passage', 'new discovery', 'return journey', 'cosmic harmony']
      }
    });

    // Underwater Adventure Theme
    this.addTheme({
      id: 'underwater-adventure',
      name: 'Underwater Adventure',
      description: 'Dive into mysterious ocean depths and aquatic realms',
      mood: ['calm', 'mysterious', 'romantic'],
      tempoRange: [60, 120],
      energyRange: [0.2, 0.8],
      colors: {
        primary: ['#0f172a', '#1e293b', '#334155'],
        secondary: ['#0ea5e9', '#06b6d4', '#14b8a6'],
        accent: ['#22d3ee', '#67e8f9', '#a7f3d0']
      },
      environments: [
        'coral reefs', 'deep ocean trenches', 'underwater caves', 'kelp forests',
        'abyssal plains', 'hydrothermal vents', 'sunken ships', 'underwater cities'
      ],
      characters: [
        'fish schools', 'whales', 'dolphins', 'sea turtles', 'jellyfish',
        'octopi', 'sharks', 'mermaids', 'deep sea creatures'
      ],
      objects: [
        'bubbles', 'seaweed', 'treasure chests', 'pearls', 'shells',
        'anchors', 'submarine', 'diving equipment', 'bioluminescent plankton'
      ],
      atmospheres: [
        'gentle currents', 'pressure waves', 'bioluminescence',
        'filtered sunlight', 'thermal vents', 'tidal forces'
      ],
      narrativeElements: {
        beginning: ['surface dive', 'first descent', 'entering blue depths'],
        middle: ['exploring reefs', 'following currents', 'discovering ruins'],
        climax: ['deep trench descent', 'encountering leviathan', 'finding treasure'],
        resolution: ['ascending to surface', 'peaceful floating', 'ocean harmony']
      }
    });
  }

  private addTheme(theme: StoryTheme): void {
    this.themes.set(theme.id, theme);
  }

  analyzeMusic(audioData: any, beatData: any): MusicCharacteristics {
    // Enhanced music analysis
    const tempo = beatData.tempo || 120;
    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const valence = this.calculateValence(audioData);
    const danceability = this.calculateDanceability(beatData, audioData);

    // Simplified genre detection based on frequency characteristics
    const genre = this.detectGenre(audioData, beatData);
    const mood = this.detectMood(energy, valence, tempo);

    const characteristics: MusicCharacteristics = {
      tempo,
      energy,
      valence,
      danceability,
      acousticness: this.calculateAcousticness(audioData),
      instrumentalness: this.calculateInstrumentalness(audioData),
      genre,
      mood,
      timeSignature: beatData.timeSignature || 4,
      key: this.detectKey(audioData)
    };

    // Store in history for trend analysis
    this.musicAnalysisHistory.push(characteristics);
    if (this.musicAnalysisHistory.length > 100) {
      this.musicAnalysisHistory.shift();
    }

    return characteristics;
  }

  selectTheme(musicCharacteristics: MusicCharacteristics): StoryTheme {
    let bestTheme: StoryTheme | null = null;
    let bestScore = -1;

    for (const theme of this.themes.values()) {
      const score = this.calculateThemeScore(theme, musicCharacteristics);
      if (score > bestScore) {
        bestScore = score;
        bestTheme = theme;
      }
    }

    if (bestTheme && bestTheme !== this.currentTheme) {
      this.currentTheme = bestTheme;
    }

    return this.currentTheme || this.themes.values().next().value;
  }

  private calculateThemeScore(theme: StoryTheme, music: MusicCharacteristics): number {
    let score = 0;

    // Tempo matching
    const [minTempo, maxTempo] = theme.tempoRange;
    if (music.tempo >= minTempo && music.tempo <= maxTempo) {
      score += 30;
    } else {
      const tempoDistance = Math.min(
        Math.abs(music.tempo - minTempo),
        Math.abs(music.tempo - maxTempo)
      );
      score += Math.max(0, 30 - tempoDistance / 10);
    }

    // Energy matching
    const [minEnergy, maxEnergy] = theme.energyRange;
    if (music.energy >= minEnergy && music.energy <= maxEnergy) {
      score += 25;
    } else {
      const energyDistance = Math.min(
        Math.abs(music.energy - minEnergy),
        Math.abs(music.energy - maxEnergy)
      );
      score += Math.max(0, 25 - energyDistance * 50);
    }

    // Mood matching
    if (theme.mood.includes(music.mood)) {
      score += 35;
    }

    // Genre bonus (simplified)
    if (music.genre === 'electronic' && theme.id === 'space-odyssey') score += 10;
    if (music.genre === 'ambient' && theme.id === 'underwater-adventure') score += 10;
    if (music.genre === 'folk' && theme.id === 'forest-journey') score += 10;

    return score;
  }

  private calculateValence(audioData: any): number {
    // Simplified valence calculation based on frequency distribution
    const brightness = audioData.treble / (audioData.bass + 0.1);
    const harmony = 1 - Math.abs(audioData.mid - 0.5) * 2;
    return Math.min(1, (brightness * 0.6 + harmony * 0.4));
  }

  private calculateDanceability(beatData: any, audioData: any): number {
    const rhythmStrength = beatData.confidence || 0.5;
    const energyLevel = (audioData.bass + audioData.mid) / 2;
    return Math.min(1, rhythmStrength * 0.7 + energyLevel * 0.3);
  }

  private calculateAcousticness(audioData: any): number {
    // Higher bass and lower treble suggests more acoustic
    return Math.min(1, audioData.bass / (audioData.treble + 0.1) * 0.5);
  }

  private calculateInstrumentalness(audioData: any): number {
    // Simplified: assume more consistent mid-range suggests instrumental
    const midConsistency = 1 - Math.abs(audioData.mid - 0.5) * 2;
    return Math.min(1, midConsistency);
  }

  private detectGenre(audioData: any, beatData: any): string {
    const tempo = beatData.tempo || 120;
    const bassLevel = audioData.bass;
    const trebleLevel = audioData.treble;

    if (tempo > 140 && bassLevel > 0.7) return 'electronic';
    if (tempo < 80 && trebleLevel < 0.3) return 'ambient';
    if (bassLevel > 0.8 && tempo > 100) return 'rock';
    if (tempo > 120 && beatData.confidence > 0.8) return 'dance';
    return 'unknown';
  }

  private detectMood(energy: number, valence: number, tempo: number): MusicCharacteristics['mood'] {
    if (energy > 0.7 && valence > 0.6) return 'energetic';
    if (energy < 0.4 && valence > 0.5) return 'calm';
    if (valence < 0.3) return 'dark';
    if (valence > 0.7 && tempo > 100) return 'uplifting';
    if (energy < 0.5 && valence < 0.5) return 'mysterious';
    if (valence > 0.6 && tempo < 100) return 'romantic';
    if (energy > 0.8) return 'aggressive';
    return 'calm';
  }

  private detectKey(audioData: any): string {
    // Simplified key detection - would need more sophisticated analysis
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keys[Math.floor(Math.random() * keys.length)];
  }

  getCurrentTheme(): StoryTheme | null {
    return this.currentTheme;
  }

  getAllThemes(): StoryTheme[] {
    return Array.from(this.themes.values());
  }

  getThemeById(id: string): StoryTheme | null {
    return this.themes.get(id) || null;
  }
}