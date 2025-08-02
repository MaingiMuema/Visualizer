'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';
import Dynamic3DImageEffects from './Dynamic3DImageEffects';
import Morphing3DImageEffects from './Morphing3DImageEffects';
import Advanced3DMorphLayers from './Advanced3DMorphLayers';
import BeatResponsiveImageTransform from './BeatResponsiveImageTransform';
import Immersive3DEffects from './Immersive3DEffects';
import CinematicEffects from './CinematicEffects';
import GlitchEffects from './GlitchEffects';
import MelodyVocalEffects from './MelodyVocalEffects';
import ImmersiveAudioVisualizers from './ImmersiveAudioVisualizers';
import FrequencyEnvironment from './FrequencyEnvironment';
import AdvancedParticleSystem from './AdvancedParticleSystem';

interface ImmersiveBackgroundProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

// Depth layer component for parallax effect
function DepthLayer({ 
  texture, 
  depth, 
  audioData, 
  beatData, 
  opacity = 0.3,
  scale = 1.2 
}: {
  texture: THREE.Texture | null;
  depth: number;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  opacity?: number;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame((state, delta) => {
    if (!meshRef.current || !audioData) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Parallax movement based on depth
    const parallaxSpeed = (1 - depth / 10) * 0.5;
    meshRef.current.position.x = Math.sin(state.clock.elapsedTime * parallaxSpeed) * energy * 2;
    meshRef.current.position.y = Math.cos(state.clock.elapsedTime * parallaxSpeed * 0.7) * energy * 1.5;

    // Beat-responsive scaling
    if (beatIntensity > 0.5) {
      const beatScale = scale * (1 + beatIntensity * 0.1);
      meshRef.current.scale.setScalar(beatScale);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }

    // Rotation based on frequency bands
    meshRef.current.rotation.z += delta * audioData.treble * 0.2;
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width * scale, viewport.height * scale]}
      position={[0, 0, -depth]}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
      />
    </Plane>
  );
}



// Volumetric fog effect
function VolumetricFog({ 
  audioData, 
  musicCharacteristics 
}: {
  audioData: AudioAnalysisData | null;
  musicCharacteristics: MusicCharacteristics | null;
}) {
  const fogRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const fogMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uBass: { value: 0 },
        uMoodColor: { value: new THREE.Vector3(0.5, 0.5, 1) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uEnergy;
        uniform float uBass;
        uniform vec3 uMoodColor;
        varying vec2 vUv;
        
        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Create volumetric fog effect
          float fog = 0.0;
          for (int i = 0; i < 3; i++) {
            float scale = float(i + 1) * 2.0;
            fog += noise(uv * scale + uTime * 0.1) / scale;
          }
          
          // Bass-responsive fog density
          fog *= (0.3 + uBass * 0.7);
          
          // Energy-based movement
          vec2 movement = vec2(
            sin(uTime * 0.5 + uv.x * 3.0) * uEnergy * 0.1,
            cos(uTime * 0.3 + uv.y * 2.0) * uEnergy * 0.1
          );
          
          fog += noise(uv + movement) * 0.2;
          
          vec3 color = uMoodColor * fog;
          gl_FragColor = vec4(color, fog * 0.3);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }, []);

  useFrame((state, delta) => {
    if (!audioData) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    
    fogMaterial.uniforms.uTime.value += delta;
    fogMaterial.uniforms.uEnergy.value = energy;
    fogMaterial.uniforms.uBass.value = audioData.bass;

    // Update mood color
    if (musicCharacteristics) {
      switch (musicCharacteristics.mood) {
        case 'dark':
          fogMaterial.uniforms.uMoodColor.value.set(0.3, 0.1, 0.5);
          break;
        case 'energetic':
          fogMaterial.uniforms.uMoodColor.value.set(1, 0.3, 0.1);
          break;
        case 'calm':
          fogMaterial.uniforms.uMoodColor.value.set(0.1, 0.3, 0.8);
          break;
        default:
          fogMaterial.uniforms.uMoodColor.value.set(0.5, 0.5, 1);
      }
    }
  });

  return (
    <Plane
      ref={fogRef}
      args={[viewport.width * 1.5, viewport.height * 1.5]}
      position={[0, 0, -5]}
      material={fogMaterial}
    />
  );
}

export default function ImmersiveBackground({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: ImmersiveBackgroundProps) {
  const { scene } = useThree();

  // Create multiple texture layers for depth
  const textures = useMemo(() => {
    if (!backgroundImage || !backgroundImage.url.startsWith('http')) {
      return [];
    }

    const loader = new THREE.TextureLoader();
    const baseTexture = loader.load(backgroundImage.url);
    
    // Create variations of the texture for different layers
    return [
      baseTexture,
      baseTexture.clone(),
      baseTexture.clone()
    ];
  }, [backgroundImage]);

  // Set scene background color based on mood
  React.useEffect(() => {
    if (musicCharacteristics) {
      let bgColor;
      switch (musicCharacteristics.mood) {
        case 'dark':
          bgColor = new THREE.Color(0x0a0a0a);
          break;
        case 'energetic':
          bgColor = new THREE.Color(0x1a0a0a);
          break;
        case 'calm':
          bgColor = new THREE.Color(0x0a0a1a);
          break;
        case 'uplifting':
          bgColor = new THREE.Color(0x1a1a0a);
          break;
        default:
          bgColor = new THREE.Color(0x000011);
      }
      scene.background = bgColor;
    }
  }, [musicCharacteristics?.mood, scene]);

  return (
    <group>
      {/* Main morphing image effect */}
      <Morphing3DImageEffects
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Additional dynamic layer for depth */}
      <Dynamic3DImageEffects
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Beat-responsive image transformations */}
      <BeatResponsiveImageTransform
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Cinematic effects (dolly zoom, dynamic zoom) */}
      <CinematicEffects
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Melody and vocal effects */}
      <MelodyVocalEffects
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Glitch effects */}
      <GlitchEffects
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Immersive 3D effects */}
      <Immersive3DEffects
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Advanced morphing layers */}
      <Advanced3DMorphLayers
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Depth layers for parallax */}
      {textures.map((texture, index) => (
        <DepthLayer
          key={index}
          texture={texture}
          depth={30 + index * 5}
          audioData={audioData}
          beatData={beatData}
          opacity={0.15 - index * 0.03}
          scale={1.5 + index * 0.1}
        />
      ))}

      {/* Volumetric fog */}
      <VolumetricFog
        audioData={audioData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Immersive audio visualizers */}
      <ImmersiveAudioVisualizers
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Frequency-responsive environment */}
      <FrequencyEnvironment
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Advanced particle system */}
      <AdvancedParticleSystem
        backgroundImage={backgroundImage}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />
    </group>
  );
}
