'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane, Cylinder, Torus, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';

interface MelodyVocalEffectsProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

// Vocal Spotlight Effect
function VocalSpotlightEffect({ 
  texture, 
  audioData, 
  beatData, 
  musicCharacteristics 
}: {
  texture: THREE.Texture | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const vocalMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uVocalPresence: { value: 0.0 },
        uVocalIntensity: { value: 0.0 },
        uSpotlightCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uSpotlightRadius: { value: 0.3 },
        uHarmonyDetection: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uVocalPresence;
        uniform float uVocalIntensity;
        uniform vec2 uSpotlightCenter;
        uniform float uSpotlightRadius;
        uniform float uHarmonyDetection;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          vec4 color = texture2D(uTexture, uv);
          
          // Vocal spotlight effect
          if (uVocalPresence > 0.3) {
            float distance = length(uv - uSpotlightCenter);
            float spotlight = 1.0 - smoothstep(0.0, uSpotlightRadius, distance);
            
            // Enhance brightness in spotlight area
            color.rgb *= 1.0 + spotlight * uVocalIntensity * 0.8;
            
            // Add warm glow for vocals
            color.r *= 1.0 + spotlight * uVocalPresence * 0.2;
            color.g *= 1.0 + spotlight * uVocalPresence * 0.1;
            
            // Harmony detection creates multiple spotlights
            if (uHarmonyDetection > 0.4) {
              vec2 harmonyCenter1 = uSpotlightCenter + vec2(0.2, 0.1);
              vec2 harmonyCenter2 = uSpotlightCenter - vec2(0.15, 0.2);
              
              float harmonySpot1 = 1.0 - smoothstep(0.0, uSpotlightRadius * 0.7, length(uv - harmonyCenter1));
              float harmonySpot2 = 1.0 - smoothstep(0.0, uSpotlightRadius * 0.6, length(uv - harmonyCenter2));
              
              color.rgb *= 1.0 + (harmonySpot1 + harmonySpot2) * uHarmonyDetection * 0.3;
            }
          }
          
          // Vocal presence creates subtle vignette
          float vignette = 1.0 - length(uv - vec2(0.5)) * 0.8;
          color.rgb *= mix(1.0, vignette, uVocalPresence * 0.3);
          
          gl_FragColor = color;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData || !meshRef.current) return;

    // Advanced vocal detection
    const vocalPresence = Math.max(0, (audioData.mid * 0.8 + audioData.treble * 0.4) - audioData.bass * 0.3);
    const vocalIntensity = vocalPresence * (1 + (beatData?.confidence || 0) * 0.3);
    
    // Harmony detection (multiple frequency peaks in mid-high range)
    const harmonyDetection = Math.min(1, audioData.mid * audioData.treble * 2);

    // Update uniforms
    vocalMaterial.uniforms.uTime.value += delta;
    vocalMaterial.uniforms.uVocalPresence.value = vocalPresence;
    vocalMaterial.uniforms.uVocalIntensity.value = vocalIntensity;
    vocalMaterial.uniforms.uHarmonyDetection.value = harmonyDetection;

    // Dynamic spotlight center based on vocal intensity
    if (vocalPresence > 0.5) {
      const newCenter = new THREE.Vector2(
        0.5 + Math.sin(state.clock.elapsedTime * 0.5) * vocalPresence * 0.1,
        0.5 + Math.cos(state.clock.elapsedTime * 0.3) * vocalPresence * 0.08
      );
      vocalMaterial.uniforms.uSpotlightCenter.value.lerp(newCenter, 0.05);
    } else {
      vocalMaterial.uniforms.uSpotlightCenter.value.lerp(new THREE.Vector2(0.5, 0.5), 0.02);
    }

    // Dynamic spotlight radius
    const targetRadius = 0.2 + vocalPresence * 0.3 + harmonyDetection * 0.2;
    vocalMaterial.uniforms.uSpotlightRadius.value = THREE.MathUtils.lerp(
      vocalMaterial.uniforms.uSpotlightRadius.value,
      targetRadius,
      0.03
    );
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width, viewport.height]}
      position={[0, 0, -7]}
      material={vocalMaterial}
    />
  );
}

// Melody Flow Effect
function MelodyFlowEffect({ 
  texture, 
  audioData, 
  beatData, 
  musicCharacteristics 
}: {
  texture: THREE.Texture | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const melodyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uMelodyStrength: { value: 0.0 },
        uMelodyDirection: { value: new THREE.Vector2(1.0, 0.0) },
        uMelodySpeed: { value: 1.0 },
        uMelodyComplexity: { value: 0.0 },
        uBeat: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uMelodyStrength;
        uniform vec2 uMelodyDirection;
        uniform float uMelodySpeed;
        uniform float uMelodyComplexity;
        uniform float uBeat;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          
          // Melody flow distortion
          if (uMelodyStrength > 0.2) {
            // Primary melody flow
            vec2 melodyFlow = uMelodyDirection * sin(uv.y * 5.0 + uTime * uMelodySpeed) * uMelodyStrength * 0.02;
            uv += melodyFlow;
            
            // Complex melody creates additional flow patterns
            if (uMelodyComplexity > 0.4) {
              vec2 complexFlow = vec2(
                sin(uv.x * 8.0 + uTime * uMelodySpeed * 1.3) * uMelodyComplexity * 0.015,
                cos(uv.y * 6.0 + uTime * uMelodySpeed * 0.8) * uMelodyComplexity * 0.01
              );
              uv += complexFlow;
            }
          }
          
          vec4 color = texture2D(uTexture, uv);
          
          // Melody-based color enhancement
          if (uMelodyStrength > 0.3) {
            // Enhance colors based on melody direction
            if (uMelodyDirection.x > 0.5) {
              color.r *= 1.0 + uMelodyStrength * 0.2; // Rising melody - more red
            } else {
              color.b *= 1.0 + uMelodyStrength * 0.2; // Falling melody - more blue
            }
            
            if (uMelodyDirection.y > 0.5) {
              color.g *= 1.0 + uMelodyStrength * 0.15; // Complex melody - more green
            }
          }
          
          // Beat synchronization with melody
          if (uBeat > 0.6 && uMelodyStrength > 0.4) {
            float melodyBeat = sin(uTime * 20.0) * uBeat * uMelodyStrength * 0.1;
            color.rgb *= 1.0 + melodyBeat;
          }
          
          gl_FragColor = color;
        }
      `,
      transparent: true
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData || !meshRef.current) return;

    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;
    
    // Melody detection (mid frequencies with rhythmic patterns)
    const melodyStrength = audioData.mid * (1 + beatIntensity * 0.4);
    
    // Melody complexity (interaction between mid and treble)
    const melodyComplexity = Math.min(1, audioData.mid * audioData.treble * 1.5);
    
    // Melody direction based on frequency changes
    const melodyDirection = new THREE.Vector2(
      audioData.treble > audioData.bass ? 1.0 : 0.0, // Rising vs falling
      melodyComplexity > 0.5 ? 1.0 : 0.0 // Simple vs complex
    );

    // Update uniforms
    melodyMaterial.uniforms.uTime.value += delta;
    melodyMaterial.uniforms.uMelodyStrength.value = melodyStrength;
    melodyMaterial.uniforms.uMelodyComplexity.value = melodyComplexity;
    melodyMaterial.uniforms.uBeat.value = beatIntensity;

    // Smooth melody direction changes
    melodyMaterial.uniforms.uMelodyDirection.value.lerp(melodyDirection, 0.05);

    // Melody speed based on tempo and energy
    const targetSpeed = 1.0 + (musicCharacteristics?.tempo || 120) / 120 + melodyStrength * 0.5;
    melodyMaterial.uniforms.uMelodySpeed.value = THREE.MathUtils.lerp(
      melodyMaterial.uniforms.uMelodySpeed.value,
      targetSpeed,
      0.02
    );
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width, viewport.height]}
      position={[0, 0, -9]}
      material={melodyMaterial}
    />
  );
}

// Advanced Vocal Presence Detector
function VocalPresenceRings({
  audioData,
  beatData,
  musicCharacteristics
}: {
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}) {
  const ringsRef = useRef<THREE.Group>(null);
  const ringMeshes = useRef<THREE.Mesh[]>([]);

  // Create multiple rings for vocal presence visualization
  const rings = useMemo(() => {
    const ringData = [];
    for (let i = 0; i < 8; i++) {
      ringData.push({
        radius: 5 + i * 3,
        thickness: 0.2 + i * 0.1,
        frequency: 1 + i * 0.3
      });
    }
    return ringData;
  }, []);

  useFrame((state, delta) => {
    if (!audioData || !ringsRef.current) return;

    // Detect vocal presence (typically in mid-high frequencies)
    const vocalPresence = (audioData.mid * 0.7 + audioData.treble * 0.3);
    const vocalIntensity = Math.max(0, vocalPresence - 0.3); // Threshold for vocal detection

    ringMeshes.current.forEach((ring, index) => {
      if (ring) {
        const ringData = rings[index];

        // Scale rings based on vocal presence
        const scale = 1 + vocalIntensity * 2 * Math.sin(state.clock.elapsedTime * ringData.frequency);
        ring.scale.setScalar(scale);

        // Color based on vocal intensity and mood
        const material = ring.material as THREE.MeshStandardMaterial;
        if (musicCharacteristics?.mood === 'romantic') {
          material.color.setRGB(1, 0.4 + vocalIntensity * 0.6, 0.6 + vocalIntensity * 0.4);
        } else if (musicCharacteristics?.mood === 'energetic') {
          material.color.setRGB(1, 0.8 + vocalIntensity * 0.2, 0.2 + vocalIntensity * 0.8);
        } else {
          material.color.setRGB(vocalIntensity, 0.5 + vocalIntensity * 0.5, 1);
        }

        // Opacity based on vocal presence
        material.opacity = 0.3 + vocalIntensity * 0.7;

        // Rotation
        ring.rotation.z += delta * vocalIntensity * 2;
      }
    });

    // Group rotation
    ringsRef.current.rotation.y += delta * vocalPresence * 0.5;
  });

  return (
    <group ref={ringsRef}>
      {rings.map((ring, index) => (
        <Torus
          key={index}
          ref={(ref) => { if (ref) ringMeshes.current[index] = ref; }}
          args={[ring.radius, ring.thickness, 16, 32]}
          position={[0, 0, -20 - index * 2]}
        >
          <meshStandardMaterial
            color="#ff6b9d"
            transparent
            opacity={0.5}
            emissive="#330022"
          />
        </Torus>
      ))}
    </group>
  );
}

export default function MelodyVocalEffects({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: MelodyVocalEffectsProps) {
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
      {/* Original texture-based effects */}
      {texture && (
        <>
          <VocalSpotlightEffect
            texture={texture}
            audioData={audioData}
            beatData={beatData}
            musicCharacteristics={musicCharacteristics}
          />

          <MelodyFlowEffect
            texture={texture}
            audioData={audioData}
            beatData={beatData}
            musicCharacteristics={musicCharacteristics}
          />
        </>
      )}

      {/* New advanced vocal presence visualizer */}
      <VocalPresenceRings
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />
    </group>
  );
}
