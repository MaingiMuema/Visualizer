export interface ExportOptions {
  format: 'webm' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  duration?: number; // If not specified, exports entire audio
  startTime?: number;
}

export interface ExportProgress {
  progress: number; // 0-1
  timeRemaining: number; // seconds
  currentFrame: number;
  totalFrames: number;
}

export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private onProgress?: (progress: ExportProgress) => void;
  private onComplete?: (blob: Blob) => void;
  private onError?: (error: Error) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async startRecording(options: ExportOptions): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      // Get canvas stream
      const stream = this.canvas.captureStream(options.fps);
      
      // Configure MediaRecorder
      const mimeType = this.getMimeType(options.format, options.quality);
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error(`Format ${options.format} with ${options.quality} quality is not supported`);
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: this.getBitrate(options.quality),
      });

      this.recordedChunks = [];
      this.isRecording = true;

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        this.isRecording = false;
        this.onComplete?.(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        this.isRecording = false;
        this.onError?.(new Error('MediaRecorder error: ' + event));
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms

    } catch (error) {
      this.isRecording = false;
      throw error;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  setProgressCallback(callback: (progress: ExportProgress) => void): void {
    this.onProgress = callback;
  }

  setCompleteCallback(callback: (blob: Blob) => void): void {
    this.onComplete = callback;
  }

  setErrorCallback(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  private getMimeType(format: 'webm' | 'mp4', quality: 'low' | 'medium' | 'high'): string {
    if (format === 'webm') {
      // Try VP9 first, fallback to VP8
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        return 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        return 'video/webm;codecs=vp8';
      }
      return 'video/webm';
    } else {
      // MP4 support varies by browser
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
        return 'video/mp4;codecs=h264';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        return 'video/mp4';
      }
      // Fallback to WebM if MP4 not supported
      return 'video/webm';
    }
  }

  private getBitrate(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low':
        return 1000000; // 1 Mbps
      case 'medium':
        return 2500000; // 2.5 Mbps
      case 'high':
        return 5000000; // 5 Mbps
      default:
        return 2500000;
    }
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Advanced export with audio synchronization
  async exportWithAudio(
    audioBuffer: AudioBuffer,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create audio context for playback synchronization
        const audioContext = new AudioContext();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Calculate export parameters
        const startTime = options.startTime || 0;
        const duration = options.duration || (audioBuffer.duration - startTime);
        const totalFrames = Math.ceil(duration * options.fps);
        
        let currentFrame = 0;
        let startRecordingTime = 0;

        // Set up progress tracking
        const progressInterval = setInterval(() => {
          if (this.isRecording && startRecordingTime > 0) {
            const elapsed = (Date.now() - startRecordingTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            currentFrame = Math.floor(progress * totalFrames);
            
            onProgress?.({
              progress,
              timeRemaining: Math.max(0, duration - elapsed),
              currentFrame,
              totalFrames,
            });
          }
        }, 100);

        // Set up completion handler
        this.setCompleteCallback((blob) => {
          clearInterval(progressInterval);
          audioContext.close();
          resolve(blob);
        });

        this.setErrorCallback((error) => {
          clearInterval(progressInterval);
          audioContext.close();
          reject(error);
        });

        // Start recording and audio playback simultaneously
        this.startRecording(options).then(() => {
          startRecordingTime = Date.now();
          
          // Start audio playback
          source.connect(audioContext.destination);
          source.start(0, startTime);
          
          // Stop recording when duration is reached
          setTimeout(() => {
            this.stopRecording();
          }, duration * 1000);
        }).catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}

// Utility functions for export management
export class ExportManager {
  private static instance: ExportManager;
  private activeExports: Map<string, VideoExporter> = new Map();

  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager();
    }
    return ExportManager.instance;
  }

  createExport(id: string, canvas: HTMLCanvasElement): VideoExporter {
    const exporter = new VideoExporter(canvas);
    this.activeExports.set(id, exporter);
    return exporter;
  }

  getExport(id: string): VideoExporter | undefined {
    return this.activeExports.get(id);
  }

  removeExport(id: string): void {
    const exporter = this.activeExports.get(id);
    if (exporter && exporter.isCurrentlyRecording()) {
      exporter.stopRecording();
    }
    this.activeExports.delete(id);
  }

  stopAllExports(): void {
    for (const [id, exporter] of this.activeExports) {
      if (exporter.isCurrentlyRecording()) {
        exporter.stopRecording();
      }
    }
    this.activeExports.clear();
  }

  getActiveExportCount(): number {
    let count = 0;
    for (const exporter of this.activeExports.values()) {
      if (exporter.isCurrentlyRecording()) {
        count++;
      }
    }
    return count;
  }
}

// Browser compatibility check
export function checkExportSupport(): {
  supported: boolean;
  formats: string[];
  issues: string[];
} {
  const issues: string[] = [];
  const formats: string[] = [];

  // Check MediaRecorder support
  if (!window.MediaRecorder) {
    issues.push('MediaRecorder API not supported');
    return { supported: false, formats, issues };
  }

  // Check canvas stream support
  const canvas = document.createElement('canvas');
  if (!canvas.captureStream) {
    issues.push('Canvas stream capture not supported');
    return { supported: false, formats, issues };
  }

  // Check supported formats
  const testFormats = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=h264',
    'video/mp4',
  ];

  for (const format of testFormats) {
    if (MediaRecorder.isTypeSupported(format)) {
      formats.push(format);
    }
  }

  if (formats.length === 0) {
    issues.push('No supported video formats found');
    return { supported: false, formats, issues };
  }

  return { supported: true, formats, issues };
}
