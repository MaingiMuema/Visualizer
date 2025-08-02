'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';
import { extend } from '@react-three/fiber';

// Custom shader material for dynamic image effects
const DynamicImageMaterial = shaderMaterial(
  {
    uTexture: null,
    uTime: 0,
    uBass: 0,
    uMid: 0,
    uTreble: 0,
    uBeat: 0,
    uEnergy: 0,
    uResolution: new THREE.Vector2(1, 1),
    uWaveIntensity: 1.0,
    uColorShift: 0.0,
    uDistortion: 0.0,
    uGlow: 0.0,
    uParticleEffect: 0.0,
    uMoodColor: new THREE.Vector3(1, 1, 1),
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
    uniform float uWaveIntensity;
    uniform float uDistortion;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      
      // Wave distortion based on bass
      float wave = sin(pos.x * 5.0 + uTime * 2.0) * cos(pos.y * 3.0 + uTime * 1.5);
      pos.z += wave * uBass * uWaveIntensity * 0.5;
      
      // Beat pulse effect
      float beatPulse = uBeat * sin(uTime * 10.0) * 0.1;
      pos.z += beatPulse;
      
      // Treble-based vertex displacement
      float trebleWave = sin(pos.x * 10.0 + uTime * 4.0) * sin(pos.y * 8.0 + uTime * 3.0);
      pos.z += trebleWave * uTreble * 0.2;
      
      // Mid-frequency ripple effect
      float ripple = sin(length(pos.xy) * 8.0 - uTime * 3.0);
      pos.z += ripple * uMid * 0.3;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform float uBeat;
    uniform float uEnergy;
    uniform vec2 uResolution;
    uniform float uColorShift;
    uniform float uGlow;
    uniform float uParticleEffect;
    uniform vec3 uMoodColor;

    varying vec2 vUv;
    varying vec3 vPosition;

    // Noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // Smooth noise
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

    // Fractal Brownian Motion for complex patterns
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    // Voronoi pattern for cellular effects
    vec2 voronoi(vec2 st) {
      vec2 i_st = floor(st);
      vec2 f_st = fract(st);
      float m_dist = 1.0;
      vec2 m_point;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 neighbor = vec2(float(i), float(j));
          vec2 point = random(i_st + neighbor) * vec2(1.0);
          point = 0.5 + 0.5 * sin(uTime + 6.2831 * point);
          vec2 diff = neighbor + point - f_st;
          float dist = length(diff);
          if (dist < m_dist) {
            m_dist = dist;
            m_point = point;
          }
        }
      }
      return m_point;
    }

    // RGB to HSV conversion function
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    // HSV to RGB conversion function
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec2 uv = vUv;

      // Advanced kaleidoscope effect for high energy
      if (uEnergy > 0.6) {
        vec2 center = vec2(0.5);
        vec2 toCenter = uv - center;
        float angle = atan(toCenter.y, toCenter.x);
        float radius = length(toCenter);

        // Create kaleidoscope segments
        float segments = 6.0 + uBeat * 4.0;
        angle = mod(angle, 6.28318 / segments);
        if (mod(floor(angle * segments / 6.28318), 2.0) == 1.0) {
          angle = 6.28318 / segments - angle;
        }

        uv = center + vec2(cos(angle), sin(angle)) * radius;
      }

      // Dynamic UV distortion based on audio with enhanced complexity
      vec2 distortion = vec2(
        sin(uv.y * 10.0 + uTime * 2.0) * uBass * 0.02,
        cos(uv.x * 8.0 + uTime * 1.5) * uTreble * 0.02
      );

      // Fractal distortion for complex patterns
      vec2 fractalDistort = vec2(
        fbm(uv * 3.0 + uTime * 0.5) * uMid * 0.015,
        fbm(uv * 2.5 + uTime * 0.7) * uTreble * 0.015
      );

      // Beat-based UV shake with intensity variation
      vec2 beatShake = vec2(
        sin(uTime * 20.0 + uBass * 10.0) * uBeat * 0.02,
        cos(uTime * 25.0 + uTreble * 8.0) * uBeat * 0.02
      );

      // Voronoi-based cellular distortion
      vec2 voronoiPoint = voronoi(uv * 5.0 + uTime * 0.3);
      vec2 voronoiDistort = (voronoiPoint - 0.5) * uMid * 0.01;

      // Mid-frequency spiral effect with dynamic intensity
      float angle = atan(uv.y - 0.5, uv.x - 0.5);
      float radius = length(uv - 0.5);
      float spiral = sin(angle * (5.0 + uEnergy * 10.0) + radius * 20.0 - uTime * 3.0) * uMid * 0.02;

      vec2 finalUV = uv + distortion + fractalDistort + beatShake + voronoiDistort + vec2(cos(angle), sin(angle)) * spiral;
      
      // Sample the texture
      vec4 texColor = texture2D(uTexture, finalUV);
      
      // Advanced color shifting with harmonic frequencies
      vec3 colorShift = vec3(
        sin(uTime + uBass * 10.0) * 0.15,
        sin(uTime * 1.2 + uMid * 8.0) * 0.15,
        sin(uTime * 0.8 + uTreble * 12.0) * 0.15
      );

      // Frequency-based color separation
      vec3 freqColors = vec3(
        uBass * sin(uTime * 2.0),
        uMid * sin(uTime * 3.0 + 2.0),
        uTreble * sin(uTime * 4.0 + 4.0)
      ) * 0.3;

      texColor.rgb += (colorShift + freqColors) * uColorShift;

      // Advanced mood-based color grading
      vec3 moodGrading = texColor.rgb;
      moodGrading = mix(moodGrading, moodGrading * uMoodColor, 0.4);

      // HSV color space manipulation for dramatic effects
      vec3 hsv = rgb2hsv(moodGrading);
      hsv.x += uBeat * 0.1; // Hue shift on beats
      hsv.y *= (1.0 + uEnergy * 0.5); // Saturation boost
      hsv.z *= (1.0 + uEnergy * 0.3); // Brightness boost
      texColor.rgb = hsv2rgb(hsv);

      // Multi-layered beat flash with color variation
      float beatFlash1 = uBeat * sin(uTime * 15.0) * 0.3;
      float beatFlash2 = uBeat * sin(uTime * 25.0 + 1.0) * 0.2;
      float beatFlash3 = uBeat * sin(uTime * 35.0 + 2.0) * 0.1;

      texColor.r += beatFlash1;
      texColor.g += beatFlash2;
      texColor.b += beatFlash3;

      // Dynamic glow with frequency-based color
      float glow = smoothstep(0.0, 1.0, 1.0 - length(uv - 0.5) * 2.0);
      vec3 glowColor = vec3(uBass, uMid, uTreble) * 2.0;
      texColor.rgb += glowColor * glow * uGlow * uEnergy;

      // Enhanced particle system with frequency-based colors
      float particleNoise = noise(uv * 50.0 + uTime * 2.0);
      float particles = step(0.97, particleNoise) * uParticleEffect;
      vec3 particleColor = vec3(
        particles * uTreble,
        particles * uMid * 0.8,
        particles * uBass * 0.6
      );
      texColor.rgb += particleColor;

      // Dynamic scanlines with beat synchronization
      float scanlines = sin(uv.y * (800.0 + uBeat * 200.0)) * 0.03 * uTreble;
      texColor.rgb += vec3(scanlines);

      // Advanced chromatic aberration with beat response
      if (uEnergy > 0.6) {
        vec2 offset = vec2(0.003 * uEnergy + uBeat * 0.002);
        texColor.r = texture2D(uTexture, finalUV + offset).r;
        texColor.b = texture2D(uTexture, finalUV - offset).b;

        // Add prismatic effect for high energy
        if (uEnergy > 0.8) {
          vec2 prismOffset1 = vec2(sin(uTime * 3.0), cos(uTime * 2.0)) * 0.001 * uEnergy;
          vec2 prismOffset2 = vec2(cos(uTime * 4.0), sin(uTime * 3.5)) * 0.001 * uEnergy;
          texColor.g = mix(texColor.g, texture2D(uTexture, finalUV + prismOffset1).g, 0.5);
          texColor.r = mix(texColor.r, texture2D(uTexture, finalUV + prismOffset2).r, 0.3);
        }
      }

      gl_FragColor = texColor;
    }
  `
);

extend({ DynamicImageMaterial });

interface Dynamic3DImageEffectsProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
  width?: number;
  height?: number;
}

export default function Dynamic3DImageEffects({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics,
  width = 1920,
  height = 1080
}: Dynamic3DImageEffectsProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Load texture
  const texture = useMemo(() => {
    if (!backgroundImage || !backgroundImage.url.startsWith('http')) {
      return null;
    }

    const loader = new THREE.TextureLoader();
    const tex = loader.load(backgroundImage.url);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [backgroundImage]);

  // Get mood color based on music characteristics
  const moodColor = useMemo(() => {
    if (!musicCharacteristics) return new THREE.Vector3(1, 1, 1);

    switch (musicCharacteristics.mood) {
      case 'energetic':
        return new THREE.Vector3(1.2, 0.8, 0.6); // Warm orange
      case 'calm':
        return new THREE.Vector3(0.6, 0.8, 1.2); // Cool blue
      case 'dark':
        return new THREE.Vector3(0.5, 0.3, 0.7); // Dark purple
      case 'uplifting':
        return new THREE.Vector3(1.2, 1.2, 0.8); // Bright yellow
      case 'romantic':
        return new THREE.Vector3(1.2, 0.6, 0.8); // Pink
      case 'aggressive':
        return new THREE.Vector3(1.3, 0.4, 0.4); // Red
      default:
        return new THREE.Vector3(1, 1, 1);
    }
  }, [musicCharacteristics]);

  // Update shader uniforms
  useFrame((_, delta) => {
    if (!materialRef.current || !audioData) return;

    const material = materialRef.current;
    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Update time
    material.uniforms.uTime.value += delta;

    // Update audio data
    material.uniforms.uBass.value = audioData.bass;
    material.uniforms.uMid.value = audioData.mid;
    material.uniforms.uTreble.value = audioData.treble;
    material.uniforms.uBeat.value = beatIntensity;
    material.uniforms.uEnergy.value = energy;

    // Update mood color
    material.uniforms.uMoodColor.value = moodColor;

    // Dynamic effects based on music characteristics
    if (musicCharacteristics) {
      // Wave intensity based on genre
      material.uniforms.uWaveIntensity.value = musicCharacteristics.genre === 'electronic' ? 2.0 : 1.0;

      // Color shift intensity
      material.uniforms.uColorShift.value = musicCharacteristics.mood === 'dark' ? 0.5 : 0.3;

      // Glow effect
      material.uniforms.uGlow.value = musicCharacteristics.mood === 'uplifting' ? 0.8 : 0.4;

      // Particle effect for electronic music
      material.uniforms.uParticleEffect.value = musicCharacteristics.genre === 'electronic' ? 1.0 : 0.3;
    }

    // Beat-responsive scaling
    if (planeRef.current && beatIntensity > 0.5) {
      const scale = 1 + beatIntensity * 0.05;
      planeRef.current.scale.setScalar(scale);
    } else if (planeRef.current) {
      planeRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }

    // Energy-based rotation
    if (planeRef.current) {
      planeRef.current.rotation.z += delta * energy * 0.1;
    }
  });

  // Update texture when it changes
  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.uniforms.uTexture.value = texture;
      materialRef.current.uniforms.uResolution.value.set(width, height);
    }
  }, [texture, width, height]);

  if (!texture) {
    return null;
  }

  return (
    <Plane
      ref={planeRef}
      args={[viewport.width, viewport.height]}
      position={[0, 0, -10]}
    >
      <dynamicImageMaterial
        ref={materialRef}
        uTexture={texture}
        uTime={0}
        uBass={0}
        uMid={0}
        uTreble={0}
        uBeat={0}
        uEnergy={0}
        uResolution={[width, height]}
        uWaveIntensity={1.0}
        uColorShift={0.3}
        uDistortion={0.0}
        uGlow={0.4}
        uParticleEffect={0.3}
        uMoodColor={moodColor}
        transparent
      />
    </Plane>
  );
}
