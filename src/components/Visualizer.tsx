'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { AudioAnalysisData } from '../utils/audioAnalyzer';

export type VisualizationMode = 
  | 'waveform'
  | 'frequencyBars'
  | 'circularSpectrum'
  | 'particles'
  | 'tunnel'
  | 'galaxy';

export interface VisualizerConfig {
  mode: VisualizationMode;
  colorScheme: 'rainbow' | 'blue' | 'purple' | 'fire' | 'ocean' | 'neon';
  sensitivity: number;
  smoothing: number;
  particleCount: number;
  showBeatFlash: boolean;
}

interface VisualizerProps {
  audioData: AudioAnalysisData | null;
  config: VisualizerConfig;
  width: number;
  height: number;
  isPlaying: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

const Visualizer = React.forwardRef<HTMLCanvasElement, VisualizerProps>(({
  audioData,
  config,
  width,
  height,
  isPlaying,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const lastBeatRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);

  const getColorScheme = useCallback((intensity: number, index?: number): string => {
    const alpha = Math.min(1, intensity * config.sensitivity);
    
    switch (config.colorScheme) {
      case 'rainbow':
        const hue = index !== undefined ? (index * 360 / 256) : (intensity * 360);
        return `hsla(${hue}, 70%, 60%, ${alpha})`;
      
      case 'blue':
        return `rgba(${Math.floor(100 + intensity * 155)}, ${Math.floor(150 + intensity * 105)}, 255, ${alpha})`;
      
      case 'purple':
        return `rgba(${Math.floor(128 + intensity * 127)}, ${Math.floor(50 + intensity * 100)}, ${Math.floor(200 + intensity * 55)}, ${alpha})`;
      
      case 'fire':
        return `rgba(255, ${Math.floor(intensity * 200)}, ${Math.floor(intensity * 100)}, ${alpha})`;
      
      case 'ocean':
        return `rgba(${Math.floor(intensity * 100)}, ${Math.floor(150 + intensity * 105)}, ${Math.floor(200 + intensity * 55)}, ${alpha})`;
      
      case 'neon':
        return `rgba(${Math.floor(50 + intensity * 205)}, 255, ${Math.floor(50 + intensity * 205)}, ${alpha})`;
      
      default:
        return `rgba(255, 255, 255, ${alpha})`;
    }
  }, [config.colorScheme, config.sensitivity]);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, data: AudioAnalysisData) => {
    const { timeData } = data;
    const centerY = height / 2;
    const amplitude = (height / 4) * config.sensitivity;

    ctx.beginPath();
    ctx.strokeStyle = getColorScheme(data.volume);
    ctx.lineWidth = 2;

    for (let i = 0; i < timeData.length; i++) {
      const x = (i / timeData.length) * width;
      const y = centerY + ((timeData[i] - 128) / 128) * amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }, [height, width, config.sensitivity, getColorScheme]);

  const drawFrequencyBars = useCallback((ctx: CanvasRenderingContext2D, data: AudioAnalysisData) => {
    const { frequencyData } = data;
    const barWidth = width / frequencyData.length;
    const maxHeight = height * 0.8;

    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * maxHeight * config.sensitivity;
      const x = i * barWidth;
      const y = height - barHeight;

      ctx.fillStyle = getColorScheme(frequencyData[i] / 255, i);
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  }, [width, height, config.sensitivity, getColorScheme]);

  const drawCircularSpectrum = useCallback((ctx: CanvasRenderingContext2D, data: AudioAnalysisData) => {
    const { frequencyData } = data;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    const maxBarLength = Math.min(width, height) * 0.2;

    rotationRef.current += data.volume * 0.02;

    for (let i = 0; i < frequencyData.length; i++) {
      const angle = (i / frequencyData.length) * Math.PI * 2 + rotationRef.current;
      const barLength = (frequencyData[i] / 255) * maxBarLength * config.sensitivity;
      
      const startX = centerX + Math.cos(angle) * radius;
      const startY = centerY + Math.sin(angle) * radius;
      const endX = centerX + Math.cos(angle) * (radius + barLength);
      const endY = centerY + Math.sin(angle) * (radius + barLength);

      ctx.beginPath();
      ctx.strokeStyle = getColorScheme(frequencyData[i] / 255, i);
      ctx.lineWidth = 2;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }, [width, height, config.sensitivity, getColorScheme]);

  const updateParticles = useCallback((data: AudioAnalysisData) => {
    const particles = particlesRef.current;
    
    // Update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.size *= 0.99;
      
      if (particle.life <= 0 || particle.size < 0.1) {
        particles.splice(i, 1);
      }
    }
    
    // Add new particles based on audio intensity
    const intensity = (data.bass + data.mid + data.treble) / 3;
    const particlesToAdd = Math.floor(intensity * config.particleCount * 0.1);
    
    for (let i = 0; i < particlesToAdd; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      
      particles.push({
        x: width / 2,
        y: height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        life: 60 + Math.random() * 120,
        maxLife: 60 + Math.random() * 120,
        color: getColorScheme(intensity),
      });
    }
    
    // Beat-triggered particle burst
    if (data.beat && Date.now() - lastBeatRef.current > 100) {
      lastBeatRef.current = Date.now();
      
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 5;
        
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * 100,
          y: height / 2 + (Math.random() - 0.5) * 100,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 6,
          life: 120,
          maxLife: 120,
          color: getColorScheme(1),
        });
      }
    }
  }, [width, height, config.particleCount, getColorScheme]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    const particles = particlesRef.current;
    
    for (const particle of particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }, []);

  const drawBeatFlash = useCallback((ctx: CanvasRenderingContext2D, data: AudioAnalysisData) => {
    if (!config.showBeatFlash || !data.beat) return;
    
    const flashIntensity = Math.min(1, data.bass * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.3})`;
    ctx.fillRect(0, 0, width, height);
  }, [config.showBeatFlash, width, height]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx || !audioData) return;

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Draw visualization based on mode
    switch (config.mode) {
      case 'waveform':
        drawWaveform(ctx, audioData);
        break;
      case 'frequencyBars':
        drawFrequencyBars(ctx, audioData);
        break;
      case 'circularSpectrum':
        drawCircularSpectrum(ctx, audioData);
        break;
      case 'particles':
        updateParticles(audioData);
        drawParticles(ctx);
        break;
      case 'tunnel':
        drawCircularSpectrum(ctx, audioData);
        updateParticles(audioData);
        drawParticles(ctx);
        break;
      case 'galaxy':
        drawCircularSpectrum(ctx, audioData);
        drawWaveform(ctx, audioData);
        updateParticles(audioData);
        drawParticles(ctx);
        break;
    }

    // Draw beat flash
    drawBeatFlash(ctx, audioData);

    animationRef.current = requestAnimationFrame(animate);
  }, [
    isPlaying,
    audioData,
    config.mode,
    width,
    height,
    drawWaveform,
    drawFrequencyBars,
    drawCircularSpectrum,
    updateParticles,
    drawParticles,
    drawBeatFlash,
  ]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  return (
    <canvas
      ref={(node) => {
        canvasRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      width={width}
      height={height}
      className="w-full h-full bg-black rounded-lg"
      style={{ width: '100%', height: '100%' }}
    />
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;
