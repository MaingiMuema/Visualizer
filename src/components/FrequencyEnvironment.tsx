'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';
import { extend } from '@react-three/fiber';

// Advanced frequency-responsive environment shader
const FrequencyEnvironmentMaterial = shaderMaterial(
  {
    uTime: 0,
    uBass: 0,
    uMid: 0,
    uTreble: 0,
    uBeat: 0,
    uEnergy: 0,
    uResolution: new THREE.Vector2(1, 1),
    uFrequencyData: new THREE.DataTexture(new Uint8Array(256 * 4), 256, 1),
    uMoodColor: new THREE.Vector3(1, 1, 1),
    uEnvironmentType: 0, // 0: space, 1: underwater, 2: forest, 3: city
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform float uBeat;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      
      // Dynamic vertex displacement based on frequency bands
      float bassWave = sin(pos.x * 0.5 + uTime * 2.0) * cos(pos.z * 0.3 + uTime * 1.5);
      pos.y += bassWave * uBass * 5.0;
      
      float midRipple = sin(length(pos.xz) * 0.2 - uTime * 3.0);
      pos.y += midRipple * uMid * 3.0;
      
      float trebleNoise = sin(pos.x * 2.0 + uTime * 4.0) * cos(pos.z * 1.5 + uTime * 3.5);
      pos.y += trebleNoise * uTreble * 2.0;
      
      // Beat-responsive vertex explosion
      if (uBeat > 0.7) {
        vec3 center = vec3(0.0, 0.0, 0.0);
        vec3 direction = normalize(pos - center);
        pos += direction * uBeat * 2.0;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform float uBeat;
    uniform float uEnergy;
    uniform vec2 uResolution;
    uniform sampler2D uFrequencyData;
    uniform vec3 uMoodColor;
    uniform float uEnvironmentType;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Noise functions
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Fractal Brownian Motion
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    // Environment-specific effects
    vec3 spaceEnvironment(vec2 uv) {
      // Starfield with frequency-responsive brightness
      float stars = step(0.98, noise(uv * 100.0 + uTime * 0.1));
      vec3 starColor = vec3(stars) * (1.0 + uTreble * 2.0);
      
      // Nebula clouds
      float nebula = fbm(uv * 3.0 + uTime * 0.2);
      vec3 nebulaColor = uMoodColor * nebula * (0.5 + uMid * 0.5);
      
      // Energy waves
      float waves = sin(uv.x * 10.0 + uTime * 3.0) * cos(uv.y * 8.0 + uTime * 2.0);
      vec3 waveColor = vec3(0.2, 0.5, 1.0) * waves * uBass * 0.3;
      
      return starColor + nebulaColor + waveColor;
    }
    
    vec3 underwaterEnvironment(vec2 uv) {
      // Caustics effect
      float caustics = sin(uv.x * 20.0 + uTime * 2.0) * cos(uv.y * 15.0 + uTime * 1.5);
      caustics += sin(uv.x * 30.0 + uTime * 3.0) * cos(uv.y * 25.0 + uTime * 2.5);
      caustics = max(0.0, caustics) * 0.5;
      
      // Water movement
      vec2 waterUV = uv + vec2(
        sin(uv.y * 5.0 + uTime * 2.0) * 0.02,
        cos(uv.x * 4.0 + uTime * 1.5) * 0.02
      );
      
      // Depth gradient
      float depth = 1.0 - uv.y;
      vec3 waterColor = mix(vec3(0.0, 0.3, 0.6), vec3(0.0, 0.1, 0.3), depth);
      
      // Frequency-responsive bubbles
      float bubbles = step(0.95, noise(waterUV * 50.0 + uTime * 1.0)) * uMid;
      
      return waterColor + caustics * uTreble * 0.5 + vec3(bubbles) * 0.3;
    }
    
    vec3 forestEnvironment(vec2 uv) {
      // Tree shadows and light filtering
      float treePattern = fbm(uv * 8.0);
      float lightFilter = sin(uv.x * 15.0 + uTime * 0.5) * 0.1 + 0.9;
      
      // Forest colors
      vec3 forestGreen = vec3(0.1, 0.4, 0.1) * treePattern;
      vec3 sunlight = vec3(1.0, 0.9, 0.6) * lightFilter * uTreble * 0.3;
      
      // Wind effect
      float wind = sin(uv.x * 10.0 + uTime * 3.0) * cos(uv.y * 8.0 + uTime * 2.0);
      vec3 windColor = vec3(0.0, 0.2, 0.0) * wind * uMid * 0.2;
      
      return forestGreen + sunlight + windColor;
    }
    
    vec3 cityEnvironment(vec2 uv) {
      // Building silhouettes
      float buildings = step(0.3, fbm(uv * 5.0));
      
      // Neon lights
      float neonPattern = sin(uv.x * 50.0 + uTime * 5.0) * cos(uv.y * 30.0 + uTime * 3.0);
      vec3 neonColor = uMoodColor * max(0.0, neonPattern) * uBeat * 0.5;
      
      // City glow
      float cityGlow = 1.0 - length(uv - 0.5) * 2.0;
      vec3 glowColor = vec3(1.0, 0.7, 0.3) * cityGlow * uEnergy * 0.3;
      
      // Traffic lights
      float traffic = step(0.98, noise(uv * 100.0 + uTime * 2.0));
      vec3 trafficColor = vec3(traffic, traffic * 0.5, 0.0) * uTreble;
      
      return vec3(buildings * 0.1) + neonColor + glowColor + trafficColor;
    }
    
    void main() {
      vec2 uv = vUv;
      vec3 color = vec3(0.0);
      
      // Select environment based on music characteristics
      if (uEnvironmentType < 0.5) {
        color = spaceEnvironment(uv);
      } else if (uEnvironmentType < 1.5) {
        color = underwaterEnvironment(uv);
      } else if (uEnvironmentType < 2.5) {
        color = forestEnvironment(uv);
      } else {
        color = cityEnvironment(uv);
      }
      
      // Global frequency-based color modulation
      color *= (1.0 + uEnergy * 0.5);
      
      // Beat flash
      if (uBeat > 0.8) {
        color += vec3(uBeat * 0.3);
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ FrequencyEnvironmentMaterial });

interface FrequencyEnvironmentProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

export default function FrequencyEnvironment({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: FrequencyEnvironmentProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Determine environment type based on music characteristics
  const environmentType = useMemo(() => {
    if (!musicCharacteristics) return 0;
    
    switch (musicCharacteristics.genre) {
      case 'electronic':
        return 3; // City
      case 'ambient':
        return 0; // Space
      case 'classical':
        return 2; // Forest
      case 'jazz':
        return 1; // Underwater
      default:
        return Math.floor(musicCharacteristics.energy * 4);
    }
  }, [musicCharacteristics]);

  // Get mood color
  const moodColor = useMemo(() => {
    if (!musicCharacteristics) return new THREE.Vector3(1, 1, 1);
    
    switch (musicCharacteristics.mood) {
      case 'energetic':
        return new THREE.Vector3(1.2, 0.8, 0.4);
      case 'calm':
        return new THREE.Vector3(0.4, 0.8, 1.2);
      case 'dark':
        return new THREE.Vector3(0.6, 0.3, 0.8);
      case 'uplifting':
        return new THREE.Vector3(1.2, 1.2, 0.6);
      default:
        return new THREE.Vector3(1, 1, 1);
    }
  }, [musicCharacteristics]);

  useFrame((_, delta) => {
    if (!materialRef.current || !audioData) return;

    const material = materialRef.current;
    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Update uniforms
    material.uniforms.uTime.value += delta;
    material.uniforms.uBass.value = audioData.bass;
    material.uniforms.uMid.value = audioData.mid;
    material.uniforms.uTreble.value = audioData.treble;
    material.uniforms.uBeat.value = beatIntensity;
    material.uniforms.uEnergy.value = energy;
    material.uniforms.uMoodColor.value = moodColor;
    material.uniforms.uEnvironmentType.value = environmentType;

    // Plane animation
    if (planeRef.current) {
      planeRef.current.rotation.z += delta * energy * 0.1;
    }
  });

  return (
    <Plane
      ref={planeRef}
      args={[viewport.width * 2, viewport.height * 2, 64, 64]}
      position={[0, 0, -50]}
    >
      <frequencyEnvironmentMaterial
        ref={materialRef}
        uTime={0}
        uBass={0}
        uMid={0}
        uTreble={0}
        uBeat={0}
        uEnergy={0}
        uResolution={[viewport.width, viewport.height]}
        uMoodColor={moodColor}
        uEnvironmentType={environmentType}
        transparent
      />
    </Plane>
  );
}
