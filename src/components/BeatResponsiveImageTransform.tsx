'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';

interface BeatResponsiveImageTransformProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

export default function BeatResponsiveImageTransform({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: BeatResponsiveImageTransformProps) {
  const groupRef = useRef<THREE.Group>(null);
  const planeRefs = useRef<THREE.Mesh[]>([]);
  const { viewport } = useThree();

  // Create multiple image planes for complex transformations
  const imageCount = 5;
  
  // Load texture
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

  // Create materials for each plane with different effects
  const materials = useMemo(() => {
    if (!texture) return [];
    
    return Array.from({ length: imageCount }, (_, i) => {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uTime: { value: 0 },
          uBass: { value: 0 },
          uMid: { value: 0 },
          uTreble: { value: 0 },
          uBeat: { value: 0 },
          uIndex: { value: i },
          uOpacity: { value: 0.3 - i * 0.05 }
        },
        vertexShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform float uBass;
          uniform float uMid;
          uniform float uTreble;
          uniform float uBeat;
          uniform float uIndex;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            
            // Different transformation for each layer
            if (uIndex == 0.0) {
              // Main layer - beat explosion
              if (uBeat > 0.8) {
                pos *= 1.0 + uBeat * 0.2;
              }
            } else if (uIndex == 1.0) {
              // Bass layer - wave distortion
              float wave = sin(pos.x * 5.0 + uTime * 3.0) * cos(pos.y * 3.0 + uTime * 2.0);
              pos.z += wave * uBass * 0.5;
            } else if (uIndex == 2.0) {
              // Mid layer - spiral twist
              float angle = atan(pos.y, pos.x);
              float radius = length(pos.xy);
              angle += uMid * sin(radius * 3.0 + uTime * 2.0) * 0.5;
              pos.x = radius * cos(angle);
              pos.y = radius * sin(angle);
            } else if (uIndex == 3.0) {
              // Treble layer - jitter effect
              pos.x += sin(uTime * 20.0) * uTreble * 0.1;
              pos.y += cos(uTime * 25.0) * uTreble * 0.1;
            } else {
              // Background layer - gentle sway
              pos.x += sin(uTime * 0.5) * 0.2;
              pos.y += cos(uTime * 0.3) * 0.15;
            }
            
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
          uniform float uIndex;
          uniform float uOpacity;
          varying vec2 vUv;
          
          void main() {
            vec2 uv = vUv;
            
            // Different UV effects for each layer
            if (uIndex == 0.0) {
              // Main layer - beat-based chromatic aberration
              if (uBeat > 0.7) {
                vec2 offset = vec2(0.005 * uBeat);
                vec4 color;
                color.r = texture2D(uTexture, uv + offset).r;
                color.g = texture2D(uTexture, uv).g;
                color.b = texture2D(uTexture, uv - offset).b;
                color.a = 1.0;
                gl_FragColor = color;
                return;
              }
            } else if (uIndex == 1.0) {
              // Bass layer - distortion
              vec2 distortion = vec2(
                sin(uv.y * 10.0 + uTime * 2.0) * uBass * 0.03,
                cos(uv.x * 8.0 + uTime * 1.5) * uBass * 0.03
              );
              uv += distortion;
            } else if (uIndex == 2.0) {
              // Mid layer - kaleidoscope
              float angle = atan(uv.y - 0.5, uv.x - 0.5);
              float radius = length(uv - 0.5);
              angle = mod(angle + uTime * uMid, 3.14159 / 4.0);
              uv = vec2(cos(angle), sin(angle)) * radius + 0.5;
            } else if (uIndex == 3.0) {
              // Treble layer - pixelation
              float pixelSize = 1.0 + uTreble * 20.0;
              uv = floor(uv * pixelSize) / pixelSize;
            }
            
            vec4 color = texture2D(uTexture, uv);
            
            // Layer-specific color effects
            if (uIndex == 1.0) {
              color.rgb *= vec3(1.2, 0.8, 0.8); // Red tint for bass
            } else if (uIndex == 2.0) {
              color.rgb *= vec3(0.8, 1.2, 0.8); // Green tint for mid
            } else if (uIndex == 3.0) {
              color.rgb *= vec3(0.8, 0.8, 1.2); // Blue tint for treble
            }
            
            color.a = uOpacity;
            gl_FragColor = color;
          }
        `,
        transparent: true,
        blending: i === 0 ? THREE.NormalBlending : THREE.AdditiveBlending
      });
    });
  }, [texture, imageCount]);

  useFrame((state, delta) => {
    if (!audioData || !groupRef.current) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Update all materials
    materials.forEach((material, i) => {
      material.uniforms.uTime.value += delta;
      material.uniforms.uBass.value = audioData.bass;
      material.uniforms.uMid.value = audioData.mid;
      material.uniforms.uTreble.value = audioData.treble;
      material.uniforms.uBeat.value = beatIntensity;
    });

    // Update individual planes
    planeRefs.current.forEach((plane, i) => {
      if (!plane) return;

      const layerOffset = i * 0.2;
      
      // Different behaviors for each layer
      switch (i) {
        case 0: // Main layer
          if (beatIntensity > 0.8) {
            plane.scale.setScalar(1 + beatIntensity * 0.15);
          } else {
            plane.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          }
          break;
          
        case 1: // Bass layer - 3D Depth Waves
          // Create depth wave effect instead of rotation
          const bassWave = Math.sin(state.clock.elapsedTime * 2 + layerOffset) * audioData.bass;
          plane.position.z = -5 - i * 2 + bassWave * 4;
          plane.position.x = Math.sin(state.clock.elapsedTime + layerOffset) * audioData.bass * 2;

          // 3D perspective tilt
          plane.rotation.x = bassWave * 0.3;
          plane.rotation.y = Math.cos(state.clock.elapsedTime * 1.5 + layerOffset) * audioData.bass * 0.2;
          break;

        case 2: // Mid layer - Cylindrical Wrap
          // Create cylindrical wrapping effect
          const midAngle = state.clock.elapsedTime * 0.5 + layerOffset;
          const radius = 8 + audioData.mid * 3;
          plane.position.x = Math.cos(midAngle) * radius * 0.3;
          plane.position.z = -5 - i * 2 + Math.sin(midAngle) * radius * 0.2;
          plane.position.y = Math.cos(state.clock.elapsedTime + layerOffset) * audioData.mid * 1.5;

          // Face towards center with perspective
          plane.lookAt(0, plane.position.y, -10);
          plane.rotation.z += Math.sin(state.clock.elapsedTime * 2) * audioData.mid * 0.1;
          break;

        case 3: // Treble layer - 3D Jitter with Perspective
          if (audioData.treble > 0.7) {
            // 3D jitter effect
            plane.position.x = (Math.random() - 0.5) * audioData.treble * 0.8;
            plane.position.y = (Math.random() - 0.5) * audioData.treble * 0.8;
            plane.position.z = -5 - i * 2 + (Math.random() - 0.5) * audioData.treble * 2;

            // Random perspective tilts
            plane.rotation.x = (Math.random() - 0.5) * audioData.treble * 0.4;
            plane.rotation.y = (Math.random() - 0.5) * audioData.treble * 0.3;
          } else {
            // Smooth return to position
            plane.position.x = THREE.MathUtils.lerp(plane.position.x, 0, 0.1);
            plane.position.y = THREE.MathUtils.lerp(plane.position.y, 0, 0.1);
            plane.position.z = THREE.MathUtils.lerp(plane.position.z, -5 - i * 2, 0.1);
            plane.rotation.x = THREE.MathUtils.lerp(plane.rotation.x, 0, 0.1);
            plane.rotation.y = THREE.MathUtils.lerp(plane.rotation.y, 0, 0.1);
          }
          break;
          
        case 4: // Background layer
          plane.scale.setScalar(1.2 + Math.sin(state.clock.elapsedTime * 0.5) * energy * 0.1);
          break;
      }
    });

    // Group-level 3D transformations
    if (musicCharacteristics) {
      // Genre-specific immersive effects
      switch (musicCharacteristics.genre) {
        case 'electronic':
          // Digital matrix-like 3D movement
          const digitalTime = state.clock.elapsedTime * 2;
          groupRef.current.position.x = Math.sin(digitalTime) * energy * 2;
          groupRef.current.position.y = Math.cos(digitalTime * 1.3) * energy * 1.5;
          groupRef.current.position.z = Math.sin(digitalTime * 0.7) * energy * 3;

          // Perspective shifts for digital feel
          groupRef.current.rotation.x = Math.sin(digitalTime * 0.5) * energy * 0.2;
          groupRef.current.rotation.y = Math.cos(digitalTime * 0.3) * energy * 0.15;
          break;

        case 'rock':
          if (beatIntensity > 0.7) {
            // Aggressive 3D shake
            groupRef.current.position.x = (Math.random() - 0.5) * beatIntensity * 0.8;
            groupRef.current.position.y = (Math.random() - 0.5) * beatIntensity * 0.8;
            groupRef.current.position.z = (Math.random() - 0.5) * beatIntensity * 1.5;

            // Random perspective jolts
            groupRef.current.rotation.x = (Math.random() - 0.5) * beatIntensity * 0.3;
            groupRef.current.rotation.y = (Math.random() - 0.5) * beatIntensity * 0.2;
          } else {
            // Smooth return to center
            groupRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.1);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
          }
          break;

        case 'ambient':
          // Floating in 3D space
          const ambientTime = state.clock.elapsedTime * 0.3;
          groupRef.current.position.x = Math.sin(ambientTime) * energy * 1.5;
          groupRef.current.position.y = Math.sin(ambientTime * 1.7) * energy * 2;
          groupRef.current.position.z = Math.cos(ambientTime * 0.8) * energy * 2.5;

          // Gentle 3D breathing
          const breathe = Math.sin(ambientTime * 2) * energy * 0.1;
          groupRef.current.scale.setScalar(1 + breathe);
          break;

        default:
          // Default 3D orbit motion
          const defaultTime = state.clock.elapsedTime * 0.5;
          groupRef.current.position.x = Math.cos(defaultTime) * energy * 1.2;
          groupRef.current.position.z = Math.sin(defaultTime) * energy * 1.8;
          groupRef.current.rotation.x = Math.sin(defaultTime * 0.7) * energy * 0.1;
      }
    }
  });

  if (!texture || materials.length === 0) return null;

  return (
    <group ref={groupRef}>
      {materials.map((material, i) => (
        <Plane
          key={i}
          ref={(ref) => {
            if (ref) planeRefs.current[i] = ref;
          }}
          args={[viewport.width, viewport.height]}
          position={[0, 0, -5 - i * 2]}
          material={material}
        />
      ))}
    </group>
  );
}
