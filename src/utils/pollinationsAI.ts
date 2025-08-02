import { StoryTheme, MusicCharacteristics } from './storyThemeEngine';

export interface GeneratedImage {
  url: string;
  croppedUrl?: string;
  prompt: string;
  theme: string;
  timestamp: number;
  cached: boolean;
}

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  style?: 'realistic' | 'artistic' | 'abstract' | 'cinematic' | 'anime';
  quality?: 'low' | 'medium' | 'high';
  seed?: number;
}

export class PollinationsAI {
  private baseUrl = 'https://image.pollinations.ai/prompt';
  private cache: Map<string, GeneratedImage> = new Map();
  private generationQueue: Array<{ prompt: string; options: ImageGenerationOptions; resolve: (image: GeneratedImage) => void }> = [];
  private isGenerating = false;
  private maxCacheSize = 50;

  constructor() {
    // Pre-warm cache with some common themes
    this.preloadCommonImages();
  }

  async generateStoryBackground(
    theme: StoryTheme,
    musicCharacteristics: MusicCharacteristics,
    sceneType: 'beginning' | 'middle' | 'climax' | 'resolution' = 'middle',
    options: ImageGenerationOptions = {}
  ): Promise<GeneratedImage> {
    const prompt = this.buildPrompt(theme, musicCharacteristics, sceneType);
    const cacheKey = this.getCacheKey(prompt, options);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { ...cached, cached: true };
    }

    // Generate new image
    const image = await this.generateImage(prompt, options);

    // Crop watermark if it's a Pollinations image
    if (image.url.includes('pollinations.ai')) {
      try {
        const croppedUrl = await this.cropWatermark(image.url);
        image.croppedUrl = croppedUrl;
      } catch (error) {
        console.warn('Failed to crop watermark:', error);
      }
    }

    return image;
  }

  private buildPrompt(
    theme: StoryTheme,
    musicCharacteristics: MusicCharacteristics,
    sceneType: 'beginning' | 'middle' | 'climax' | 'resolution'
  ): string {
    const baseElements = [
      this.selectRandomElement(theme.environments),
      this.selectRandomElement(theme.atmospheres),
    ];

    const narrativeElement = this.selectRandomElement(theme.narrativeElements[sceneType]);
    
    // Add mood-based descriptors
    const moodDescriptors = this.getMoodDescriptors(musicCharacteristics.mood);
    const energyDescriptors = this.getEnergyDescriptors(musicCharacteristics.energy);
    const tempoDescriptors = this.getTempoDescriptors(musicCharacteristics.tempo);

    // Build color palette description
    const colorDescription = this.buildColorDescription(theme.colors, musicCharacteristics);

    // Combine all elements
    const promptParts = [
      `${narrativeElement} in ${baseElements[0]}`,
      `${baseElements[1]} atmosphere`,
      ...moodDescriptors,
      ...energyDescriptors,
      ...tempoDescriptors,
      colorDescription,
      'highly detailed, cinematic lighting, 4K resolution',
      this.getStyleModifiers(musicCharacteristics)
    ];

    return promptParts.filter(Boolean).join(', ');
  }

  private selectRandomElement(array: string[]): string {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getMoodDescriptors(mood: string): string[] {
    const moodMap: Record<string, string[]> = {
      energetic: ['dynamic', 'vibrant', 'explosive', 'intense'],
      calm: ['serene', 'peaceful', 'tranquil', 'gentle'],
      dark: ['mysterious', 'shadowy', 'ominous', 'dramatic'],
      uplifting: ['bright', 'inspiring', 'radiant', 'hopeful'],
      mysterious: ['enigmatic', 'ethereal', 'mystical', 'otherworldly'],
      romantic: ['dreamy', 'soft', 'warm', 'intimate'],
      aggressive: ['powerful', 'fierce', 'bold', 'striking']
    };

    return moodMap[mood] || ['atmospheric'];
  }

  private getEnergyDescriptors(energy: number): string[] {
    if (energy > 0.8) return ['high energy', 'explosive', 'intense motion'];
    if (energy > 0.6) return ['dynamic', 'active', 'flowing movement'];
    if (energy > 0.4) return ['moderate energy', 'gentle motion'];
    return ['calm', 'still', 'peaceful'];
  }

  private getTempoDescriptors(tempo: number): string[] {
    if (tempo > 140) return ['fast-paced', 'rapid', 'quick transitions'];
    if (tempo > 100) return ['moderate pace', 'steady rhythm'];
    if (tempo > 80) return ['relaxed pace', 'slow motion'];
    return ['very slow', 'meditative', 'contemplative'];
  }

  private buildColorDescription(colors: StoryTheme['colors'], music: MusicCharacteristics): string {
    const primaryColor = this.selectRandomElement(colors.primary);
    const accentColor = this.selectRandomElement(colors.accent);
    
    // Adjust colors based on music characteristics
    let colorIntensity = 'muted';
    if (music.energy > 0.7) colorIntensity = 'vibrant';
    else if (music.energy > 0.4) colorIntensity = 'rich';

    return `${colorIntensity} colors, ${primaryColor} and ${accentColor} color palette`;
  }

  private getStyleModifiers(music: MusicCharacteristics): string {
    const styles = [];
    
    if (music.genre === 'electronic') styles.push('futuristic', 'digital art style');
    if (music.genre === 'ambient') styles.push('ethereal', 'soft focus');
    if (music.genre === 'rock') styles.push('dramatic', 'high contrast');
    if (music.acousticness > 0.6) styles.push('organic', 'natural textures');
    if (music.instrumentalness > 0.7) styles.push('abstract', 'artistic interpretation');

    return styles.join(', ');
  }

  private async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<GeneratedImage> {
    const defaultOptions: Required<ImageGenerationOptions> = {
      width: 1920,
      height: 1080,
      style: 'cinematic',
      quality: 'high',
      seed: Math.floor(Math.random() * 1000000),
      ...options
    };

    // Build URL with parameters
    const params = new URLSearchParams({
      width: defaultOptions.width.toString(),
      height: defaultOptions.height.toString(),
      seed: defaultOptions.seed.toString(),
      enhance: defaultOptions.quality === 'high' ? 'true' : 'false'
    });

    const url = `${this.baseUrl}/${encodeURIComponent(prompt)}?${params.toString()}`;

    try {
      // Test if image loads successfully
      await this.testImageLoad(url);

      const generatedImage: GeneratedImage = {
        url,
        prompt,
        theme: 'generated',
        timestamp: Date.now(),
        cached: false
      };

      // Cache the result
      const cacheKey = this.getCacheKey(prompt, options);
      this.addToCache(cacheKey, generatedImage);

      return generatedImage;
    } catch (error) {
      console.error('Failed to generate image:', error);
      // Return a fallback gradient background
      return this.createFallbackImage(prompt);
    }
  }

  private async testImageLoad(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  private createFallbackImage(prompt: string): GeneratedImage {
    // Create a data URL for a gradient background as fallback
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // Create gradient based on prompt keywords
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    if (prompt.includes('space') || prompt.includes('cosmic')) {
      gradient.addColorStop(0, '#0a0a2e');
      gradient.addColorStop(1, '#16213e');
    } else if (prompt.includes('underwater') || prompt.includes('ocean')) {
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#0ea5e9');
    } else {
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, '#4a4a4a');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return {
      url: canvas.toDataURL(),
      prompt,
      theme: 'fallback',
      timestamp: Date.now(),
      cached: false
    };
  }

  private getCacheKey(prompt: string, options: ImageGenerationOptions): string {
    return `${prompt}_${JSON.stringify(options)}`;
  }

  private addToCache(key: string, image: GeneratedImage): void {
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, image);
  }

  private async preloadCommonImages(): void {
    const commonPrompts = [
      'space nebula with stars, cosmic atmosphere, cinematic lighting',
      'underwater coral reef, bioluminescent, peaceful atmosphere',
      'abstract digital landscape, flowing particles, ethereal'
    ];

    for (const prompt of commonPrompts) {
      try {
        await this.generateImage(prompt, { quality: 'medium' });
      } catch (error) {
        console.warn('Failed to preload image:', prompt);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCachedImages(): GeneratedImage[] {
    return Array.from(this.cache.values());
  }

  private async cropWatermark(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Set canvas size to crop bottom 10% (where watermark usually is)
          const cropHeight = Math.floor(img.height * 0.9); // Remove bottom 10%
          canvas.width = img.width;
          canvas.height = cropHeight;

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw the cropped image
          ctx.drawImage(
            img,
            0, 0, img.width, cropHeight, // Source rectangle (crop from top)
            0, 0, img.width, cropHeight  // Destination rectangle
          );

          // Convert to data URL
          const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(croppedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for cropping'));
      };

      img.src = imageUrl;
    });
  }
}
