'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';

interface Advanced3DMorphLayersProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

// Liquid morphing layer
function LiquidMorphLayer({ 
  texture, 
  audioData, 
  beatData, 
  musicCharacteristics,
  depth = -15 
}: {
  texture: THREE.Texture | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
  depth?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const liquidMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uBeat: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Liquid wave effect
          float wave1 = sin(pos.x * 3.0 + uTime * 2.0) * cos(pos.y * 2.0 + uTime * 1.5);
          float wave2 = sin(pos.x * 5.0 + uTime * 3.0) * cos(pos.y * 4.0 + uTime * 2.5);
          
          pos.z += (wave1 + wave2) * uBass * 0.3;
          
          // Mid-frequency ripples
          float ripple = sin(length(pos.xy) * 8.0 - uTime * 4.0);
          pos.z += ripple * uMid * 0.2;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uBass;
        uniform float uTreble;
        uniform float uBeat;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          
          // Liquid distortion
          vec2 distortion = vec2(
            sin(uv.y * 8.0 + uTime * 2.0) * uBass * 0.05,
            cos(uv.x * 6.0 + uTime * 1.5) * uTreble * 0.05
          );
          
          vec4 color = texture2D(uTexture, uv + distortion);
          
          // Beat-based transparency
          color.a = 0.4 + uBeat * 0.3;
          
          gl_FragColor = color;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData || !meshRef.current) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Update uniforms
    liquidMaterial.uniforms.uTime.value += delta;
    liquidMaterial.uniforms.uBass.value = audioData.bass;
    liquidMaterial.uniforms.uMid.value = audioData.mid;
    liquidMaterial.uniforms.uTreble.value = audioData.treble;
    liquidMaterial.uniforms.uBeat.value = beatIntensity;

    // Gentle floating motion
    meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * energy * 2;
    meshRef.current.position.y = Math.cos(state.clock.elapsedTime * 0.2) * energy * 1.5;
    
    // Beat-responsive scaling
    if (beatIntensity > 0.5) {
      meshRef.current.scale.setScalar(1.1 + beatIntensity * 0.1);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
    }
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width * 1.2, viewport.height * 1.2]}
      position={[0, 0, depth]}
      material={liquidMaterial}
    />
  );
}

// Crystalline fractal layer
function CrystallineFractalLayer({ 
  texture, 
  audioData, 
  beatData, 
  musicCharacteristics,
  depth = -20 
}: {
  texture: THREE.Texture | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
  depth?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const fractalMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uBeat: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uTreble;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Crystalline faceting
          float facet = floor(pos.x * 10.0) * 0.1 + floor(pos.y * 10.0) * 0.1;
          pos.z += sin(facet + uTime * 2.0) * uTreble * 0.2;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uBeat;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          
          // Kaleidoscope effect
          float angle = atan(uv.y - 0.5, uv.x - 0.5);
          float radius = length(uv - 0.5);
          
          angle = mod(angle + uTime * 0.5, 3.14159 / 3.0);
          uv = vec2(cos(angle), sin(angle)) * radius + 0.5;
          
          // Fractal distortion
          for (int i = 0; i < 3; i++) {
            uv = abs(uv * 2.0 - 1.0);
            uv /= dot(uv, uv);
            uv = uv * 0.5 + 0.5;
          }
          
          vec4 color = texture2D(uTexture, uv);
          
          // Crystalline color shift
          color.rgb += vec3(
            sin(uTime + uTreble * 5.0) * 0.2,
            cos(uTime * 1.2 + uMid * 4.0) * 0.2,
            sin(uTime * 0.8 + uBass * 3.0) * 0.2
          );
          
          color.a = 0.3 + uBeat * 0.4;
          
          gl_FragColor = color;
        }
      `,
      transparent: true,
      blending: THREE.MultiplyBlending,
      premultipliedAlpha: true
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData || !meshRef.current) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Update uniforms
    fractalMaterial.uniforms.uTime.value += delta;
    fractalMaterial.uniforms.uBass.value = audioData.bass;
    fractalMaterial.uniforms.uMid.value = audioData.mid;
    fractalMaterial.uniforms.uTreble.value = audioData.treble;
    fractalMaterial.uniforms.uBeat.value = beatIntensity;

    // 3D Crystalline Facet Movement based on treble
    const facetTime = state.clock.elapsedTime * 2;
    const trebleIntensity = audioData.treble;

    // Create crystalline 3D movement pattern
    meshRef.current.position.x = Math.sin(facetTime * 1.3) * trebleIntensity * 3;
    meshRef.current.position.y = Math.cos(facetTime * 0.9) * trebleIntensity * 2;
    meshRef.current.position.z = depth + Math.sin(facetTime * 0.7) * trebleIntensity * 4;

    // 3D perspective tilts for crystalline effect
    meshRef.current.rotation.x = Math.sin(facetTime * 1.1) * trebleIntensity * 0.4;
    meshRef.current.rotation.y = Math.cos(facetTime * 1.5) * trebleIntensity * 0.3;
    meshRef.current.rotation.z = Math.sin(facetTime * 0.8) * trebleIntensity * 0.2;

    // Beat-responsive 3D explosion
    if (beatIntensity > 0.6) {
      const explosionRadius = beatIntensity * 5;
      meshRef.current.position.x += (Math.random() - 0.5) * explosionRadius;
      meshRef.current.position.y += (Math.random() - 0.5) * explosionRadius;
      meshRef.current.position.z += (Math.random() - 0.5) * explosionRadius * 0.5;

      // Random 3D orientation during beats
      meshRef.current.rotation.x += (Math.random() - 0.5) * beatIntensity * 0.5;
      meshRef.current.rotation.y += (Math.random() - 0.5) * beatIntensity * 0.4;
    }
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width * 1.3, viewport.height * 1.3]}
      position={[0, 0, depth]}
      material={fractalMaterial}
    />
  );
}

// Organic flow layer
function OrganicFlowLayer({ 
  texture, 
  audioData, 
  beatData, 
  musicCharacteristics,
  depth = -25 
}: {
  texture: THREE.Texture | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
  depth?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const organicMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uBeat: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uMid;
        uniform float uBass;
        
        // Simplex noise function (simplified)
        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Organic flowing motion
          float flow1 = noise(pos.xy * 2.0 + uTime * 0.5) * 2.0 - 1.0;
          float flow2 = noise(pos.xy * 3.0 + uTime * 0.3) * 2.0 - 1.0;
          
          pos.z += (flow1 + flow2) * uMid * 0.4;
          
          // Bass-driven breathing effect
          float breathing = sin(uTime * 2.0) * uBass * 0.3;
          pos *= 1.0 + breathing;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uBeat;
        varying vec2 vUv;
        
        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Organic flow distortion
          vec2 flow = vec2(
            noise(uv * 5.0 + uTime * 0.2) * 2.0 - 1.0,
            noise(uv * 4.0 + uTime * 0.3) * 2.0 - 1.0
          ) * uMid * 0.1;
          
          vec4 color = texture2D(uTexture, uv + flow);
          
          // Organic color breathing
          float breathe = sin(uTime * 1.5) * 0.5 + 0.5;
          color.rgb = mix(color.rgb, color.rgb * vec3(1.2, 0.8, 1.1), breathe * uBass);
          
          color.a = 0.2 + uBeat * 0.3;
          
          gl_FragColor = color;
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData || !meshRef.current) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Update uniforms
    organicMaterial.uniforms.uTime.value += delta;
    organicMaterial.uniforms.uBass.value = audioData.bass;
    organicMaterial.uniforms.uMid.value = audioData.mid;
    organicMaterial.uniforms.uTreble.value = audioData.treble;
    organicMaterial.uniforms.uBeat.value = beatIntensity;

    // Organic 3D breathing and flowing motion
    const organicTime = state.clock.elapsedTime * 1.5;
    const breathe = Math.sin(organicTime) * energy * 0.05;
    meshRef.current.scale.setScalar(1.4 + breathe);

    // 3D organic flow movement
    meshRef.current.position.x = Math.sin(organicTime * 0.3) * energy * 2;
    meshRef.current.position.y = Math.cos(organicTime * 0.4) * energy * 1.5;
    meshRef.current.position.z = depth + Math.sin(organicTime * 0.2) * energy * 3;

    // Gentle 3D undulation instead of rotation
    meshRef.current.rotation.x = Math.sin(organicTime * 0.6) * energy * 0.15;
    meshRef.current.rotation.y = Math.cos(organicTime * 0.5) * energy * 0.1;
    meshRef.current.rotation.z = Math.sin(organicTime * 0.4) * energy * 0.08;

    // Organic pulsing based on bass
    if (audioData.bass > 0.5) {
      const pulse = Math.sin(organicTime * 4) * audioData.bass * 0.1;
      meshRef.current.scale.x += pulse;
      meshRef.current.scale.y += pulse * 0.8;
    }
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width * 1.4, viewport.height * 1.4]}
      position={[0, 0, depth]}
      material={organicMaterial}
    />
  );
}

export default function Advanced3DMorphLayers({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: Advanced3DMorphLayersProps) {
  // Create texture from image
  const texture = useMemo(() => {
    if (!backgroundImage) return null;
    
    const imageUrl = backgroundImage.croppedUrl || backgroundImage.url;
    
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      return null;
    }
    
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [backgroundImage]);

  if (!texture) return null;

  return (
    <group>
      {/* Liquid morphing layer */}
      <LiquidMorphLayer
        texture={texture}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
        depth={-15}
      />
      
      {/* Crystalline fractal layer */}
      <CrystallineFractalLayer
        texture={texture}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
        depth={-20}
      />
      
      {/* Organic flow layer */}
      <OrganicFlowLayer
        texture={texture}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
        depth={-25}
      />
    </group>
  );
}
