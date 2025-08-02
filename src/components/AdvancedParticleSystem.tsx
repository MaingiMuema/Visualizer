'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Points, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';
import { extend } from '@react-three/fiber';

// Advanced particle shader material
const AdvancedParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uBass: 0,
    uMid: 0,
    uTreble: 0,
    uBeat: 0,
    uEnergy: 0,
    uVocalPresence: 0,
    uMoodColor: new THREE.Vector3(1, 1, 1),
    uParticleSize: 2.0,
    uOpacity: 1.0,
  },
  // Vertex shader
  `
    attribute float aSize;
    attribute vec3 aVelocity;
    attribute float aLifetime;
    attribute float aBeat;
    attribute float aFrequency;
    
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform float uBeat;
    uniform float uEnergy;
    uniform float uVocalPresence;
    uniform float uParticleSize;
    
    varying float vLifetime;
    varying float vBeat;
    varying float vFrequency;
    varying vec3 vColor;
    
    void main() {
      vLifetime = aLifetime;
      vBeat = aBeat;
      vFrequency = aFrequency;
      
      vec3 pos = position;
      
      // Frequency-based movement
      if (aFrequency < 0.33) {
        // Bass particles - move in waves
        pos.y += sin(uTime * 2.0 + pos.x * 0.1) * uBass * 10.0;
        pos.z += cos(uTime * 1.5 + pos.y * 0.1) * uBass * 5.0;
        vColor = vec3(1.0, 0.3, 0.3); // Red for bass
      } else if (aFrequency < 0.66) {
        // Mid particles - circular motion
        float angle = uTime * 3.0 + length(pos.xy) * 0.1;
        pos.x += cos(angle) * uMid * 8.0;
        pos.z += sin(angle) * uMid * 8.0;
        vColor = vec3(0.3, 1.0, 0.3); // Green for mid
      } else {
        // Treble particles - rapid oscillation
        pos.x += sin(uTime * 8.0 + pos.z * 0.2) * uTreble * 6.0;
        pos.y += cos(uTime * 10.0 + pos.x * 0.2) * uTreble * 4.0;
        vColor = vec3(0.3, 0.3, 1.0); // Blue for treble
      }
      
      // Beat-responsive explosion
      if (uBeat > 0.7 && aBeat > 0.5) {
        vec3 center = vec3(0.0);
        vec3 direction = normalize(pos - center);
        pos += direction * uBeat * 20.0;
      }
      
      // Vocal presence effect - particles form patterns
      if (uVocalPresence > 0.4) {
        float vocalPattern = sin(pos.x * 0.1 + uTime) * cos(pos.z * 0.1 + uTime * 1.2);
        pos.y += vocalPattern * uVocalPresence * 5.0;
      }
      
      // Size based on energy and frequency
      float size = aSize * uParticleSize * (1.0 + uEnergy * 2.0);
      if (aFrequency < 0.33) size *= (1.0 + uBass * 3.0);
      else if (aFrequency < 0.66) size *= (1.0 + uMid * 2.0);
      else size *= (1.0 + uTreble * 4.0);
      
      gl_PointSize = size;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float uTime;
    uniform float uBeat;
    uniform float uEnergy;
    uniform vec3 uMoodColor;
    uniform float uOpacity;
    
    varying float vLifetime;
    varying float vBeat;
    varying float vFrequency;
    varying vec3 vColor;
    
    void main() {
      // Circular particle shape
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      
      if (dist > 0.5) discard;
      
      // Soft edges
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      
      // Color mixing
      vec3 finalColor = mix(vColor, uMoodColor, 0.3);
      
      // Beat flash
      if (uBeat > 0.8 && vBeat > 0.5) {
        finalColor += vec3(0.5);
        alpha += 0.3;
      }
      
      // Energy-based brightness
      finalColor *= (1.0 + uEnergy * 0.8);
      
      // Lifetime fade
      alpha *= vLifetime;
      
      gl_FragColor = vec4(finalColor, alpha * uOpacity);
    }
  `
);

extend({ AdvancedParticleMaterial });

interface AdvancedParticleSystemProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

export default function AdvancedParticleSystem({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: AdvancedParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const particleCount = 5000;

  // Create particle attributes
  const { positions, sizes, velocities, lifetimes, beats, frequencies } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const beats = new Float32Array(particleCount);
    const frequencies = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Random positions in a sphere
      const radius = Math.random() * 100 + 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random sizes
      sizes[i] = Math.random() * 3 + 1;

      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Random lifetimes
      lifetimes[i] = Math.random();

      // Random beat responsiveness
      beats[i] = Math.random();

      // Frequency assignment (bass, mid, treble)
      frequencies[i] = Math.random();
    }

    return { positions, sizes, velocities, lifetimes, beats, frequencies };
  }, []);

  // Get mood color
  const moodColor = useMemo(() => {
    if (!musicCharacteristics) return new THREE.Vector3(1, 1, 1);
    
    switch (musicCharacteristics.mood) {
      case 'energetic':
        return new THREE.Vector3(1.2, 0.6, 0.2);
      case 'calm':
        return new THREE.Vector3(0.2, 0.6, 1.2);
      case 'dark':
        return new THREE.Vector3(0.6, 0.2, 0.8);
      case 'uplifting':
        return new THREE.Vector3(1.2, 1.0, 0.4);
      case 'romantic':
        return new THREE.Vector3(1.2, 0.4, 0.6);
      default:
        return new THREE.Vector3(1, 1, 1);
    }
  }, [musicCharacteristics]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current || !audioData) return;

    const geometry = pointsRef.current.geometry;
    const material = materialRef.current;
    
    // Update material uniforms
    material.uniforms.uTime.value += delta;
    material.uniforms.uBass.value = audioData.bass;
    material.uniforms.uMid.value = audioData.mid;
    material.uniforms.uTreble.value = audioData.treble;
    material.uniforms.uBeat.value = beatData?.isBeat ? beatData.confidence : 0;
    material.uniforms.uEnergy.value = (audioData.bass + audioData.mid + audioData.treble) / 3;
    material.uniforms.uVocalPresence.value = (audioData.mid * 0.7 + audioData.treble * 0.3);
    material.uniforms.uMoodColor.value = moodColor;

    // Update particle positions
    const positionAttribute = geometry.attributes.position;
    const lifetimeAttribute = geometry.attributes.aLifetime;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Update lifetime
      lifetimes[i] -= delta * 0.5;
      if (lifetimes[i] <= 0) {
        lifetimes[i] = 1.0;
        
        // Reset position
        const radius = Math.random() * 100 + 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        positionAttribute.array[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positionAttribute.array[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positionAttribute.array[i3 + 2] = radius * Math.cos(phi);
      }
      
      lifetimeAttribute.array[i] = lifetimes[i];
    }

    positionAttribute.needsUpdate = true;
    lifetimeAttribute.needsUpdate = true;

    // Rotate the entire system
    pointsRef.current.rotation.y += delta * audioData.mid * 0.5;
    pointsRef.current.rotation.x += delta * audioData.treble * 0.3;
  });

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aVelocity"
          count={particleCount}
          array={velocities}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aLifetime"
          count={particleCount}
          array={lifetimes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aBeat"
          count={particleCount}
          array={beats}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aFrequency"
          count={particleCount}
          array={frequencies}
          itemSize={1}
        />
      </bufferGeometry>
      <advancedParticleMaterial
        ref={materialRef}
        uTime={0}
        uBass={0}
        uMid={0}
        uTreble={0}
        uBeat={0}
        uEnergy={0}
        uVocalPresence={0}
        uMoodColor={moodColor}
        uParticleSize={2.0}
        uOpacity={0.8}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </Points>
  );
}
