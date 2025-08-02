'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { StoryTheme, MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';
import ImmersiveBackground from './ImmersiveBackground';

interface StoryVisualizerProps {
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
  storyTheme: StoryTheme | null;
  backgroundImage: GeneratedImage | null;
  width: number;
  height: number;
  isPlaying: boolean;
}

// Simple ambient lighting component
function AmbientLighting({
  audioData,
  beatData,
  musicCharacteristics
}: {
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}) {
  return (
    <>
      {/* Dynamic lighting based on music */}
      <ambientLight intensity={0.2 + (audioData?.volume || 0) * 0.3} />
      <pointLight
        position={[10, 10, 10]}
        intensity={0.5 + (audioData?.treble || 0) * 0.5}
        color={musicCharacteristics?.mood === 'energetic' ? '#ff6b6b' : '#ffffff'}
      />
      <pointLight
        position={[-10, -10, -10]}
        intensity={0.3 + (audioData?.bass || 0) * 0.4}
        color={musicCharacteristics?.mood === 'dark' ? '#2c3e50' : '#4444ff'}
      />

      {/* Beat-responsive spotlight */}
      {beatData?.isBeat && beatData.confidence > 0.7 && (
        <spotLight
          position={[0, 20, 0]}
          angle={Math.PI / 4}
          penumbra={0.5}
          intensity={beatData.confidence * 2}
          color={musicCharacteristics?.mood === 'aggressive' ? '#ff0000' : '#ffffff'}
          castShadow
        />
      )}
    </>
  );
}

// Simple camera controller with basic audio responsiveness
function SimpleCameraController({
  audioData,
  beatData
}: {
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
}) {
  const { camera } = useThree();

  useFrame((state, delta) => {
    if (!audioData) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Gentle camera movement based on energy
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.5) * energy * 2;
    camera.position.y = Math.cos(state.clock.elapsedTime * 0.3) * energy * 1.5;
    camera.position.z = 20 + Math.sin(state.clock.elapsedTime * 0.2) * energy * 3;

    // Subtle beat-responsive camera shake
    if (beatIntensity > 0.7) {
      camera.position.x += (Math.random() - 0.5) * beatIntensity * 0.5;
      camera.position.y += (Math.random() - 0.5) * beatIntensity * 0.5;
    }
  });

  return null;
}

export default function StoryVisualizer({
  audioData,
  beatData,
  musicCharacteristics,
  storyTheme,
  backgroundImage,
  width,
  height,
  isPlaying
}: StoryVisualizerProps) {

  return (
    <div style={{ width, height, background: '#000' }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: false, // Disable for better performance
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={Math.min(window.devicePixelRatio, 2)} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow frame rate to drop to maintain performance
      >
        {/* Immersive background with all morphing effects */}
        <ImmersiveBackground
          backgroundImage={backgroundImage}
          audioData={audioData}
          beatData={beatData}
          musicCharacteristics={musicCharacteristics}
        />

        {/* Simple camera controller */}
        <SimpleCameraController
          audioData={audioData}
          beatData={beatData}
        />

        {/* Ambient lighting */}
        <AmbientLighting
          audioData={audioData}
          beatData={beatData}
          musicCharacteristics={musicCharacteristics}
        />

        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>

      {/* Music info overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
        <div className="text-sm font-medium">
          {musicCharacteristics ? `${musicCharacteristics.mood} ${musicCharacteristics.genre}` : 'Immersive Background'}
        </div>
        {musicCharacteristics && (
          <div className="text-xs opacity-75">
            Energy: {Math.round(musicCharacteristics.energy * 100)}% |
            Tempo: {Math.round(musicCharacteristics.tempo)} BPM
          </div>
        )}
      </div>

      {/* Background effects status */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          3D Effects Active
        </div>
        {backgroundImage && (
          <div className="text-green-400 mt-1">
            {backgroundImage.croppedUrl ? 'Cropped Image' : 'Original Image'}
          </div>
        )}
      </div>
    </div>
  );
}
