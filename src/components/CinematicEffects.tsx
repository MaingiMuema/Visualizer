'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';

interface CinematicEffectsProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

// Dolly Zoom Effect Component
function DollyZoomEffect({ 
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
  const { camera, viewport } = useThree();

  const dollyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uZoom: { value: 1.0 },
        uDollyIntensity: { value: 0.0 },
        uVocalPresence: { value: 0.0 },
        uMelodyStrength: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uZoom;
        uniform float uDollyIntensity;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Dolly zoom vertex distortion
          pos.xy *= 1.0 + uDollyIntensity * 0.2;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uZoom;
        uniform float uDollyIntensity;
        uniform float uVocalPresence;
        uniform float uMelodyStrength;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.5);
          
          // Dolly zoom effect - zoom in while perspective distorts
          vec2 toCenter = uv - center;
          float distance = length(toCenter);
          
          // Zoom based on melody strength
          uv = center + toCenter * (1.0 / uZoom);
          
          // Dolly distortion - barrel/pincushion effect
          float dollyDistortion = uDollyIntensity * distance * distance;
          uv = center + toCenter * (1.0 + dollyDistortion);
          
          // Vocal presence creates chromatic aberration
          vec4 color;
          if (uVocalPresence > 0.3) {
            float aberration = uVocalPresence * 0.01;
            color.r = texture2D(uTexture, uv + vec2(aberration, 0.0)).r;
            color.g = texture2D(uTexture, uv).g;
            color.b = texture2D(uTexture, uv - vec2(aberration, 0.0)).b;
            color.a = 1.0;
          } else {
            color = texture2D(uTexture, uv);
          }
          
          gl_FragColor = color;
        }
      `,
      transparent: true
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData || !meshRef.current) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;
    
    // Estimate vocal presence (high mid + treble with low bass)
    const vocalPresence = (audioData.mid * 0.6 + audioData.treble * 0.4) * (1 - audioData.bass * 0.3);
    
    // Estimate melody strength (mid frequencies with rhythmic patterns)
    const melodyStrength = audioData.mid * (1 + beatIntensity * 0.5);

    // Update uniforms
    dollyMaterial.uniforms.uTime.value += delta;
    dollyMaterial.uniforms.uVocalPresence.value = vocalPresence;
    dollyMaterial.uniforms.uMelodyStrength.value = melodyStrength;

    // Dolly zoom effect - zoom in during vocal/melody peaks
    if (vocalPresence > 0.6 || melodyStrength > 0.7) {
      const targetZoom = 1.2 + vocalPresence * 0.5 + melodyStrength * 0.3;
      dollyMaterial.uniforms.uZoom.value = THREE.MathUtils.lerp(
        dollyMaterial.uniforms.uZoom.value, 
        targetZoom, 
        0.05
      );
      
      // Dolly distortion intensity
      const targetDolly = (vocalPresence + melodyStrength) * 0.5;
      dollyMaterial.uniforms.uDollyIntensity.value = THREE.MathUtils.lerp(
        dollyMaterial.uniforms.uDollyIntensity.value,
        targetDolly,
        0.03
      );

      // Camera distance adjustment for dolly effect
      const targetDistance = 15 - (vocalPresence + melodyStrength) * 5;
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetDistance, 0.02);
    } else {
      // Return to normal
      dollyMaterial.uniforms.uZoom.value = THREE.MathUtils.lerp(
        dollyMaterial.uniforms.uZoom.value, 
        1.0, 
        0.02
      );
      dollyMaterial.uniforms.uDollyIntensity.value = THREE.MathUtils.lerp(
        dollyMaterial.uniforms.uDollyIntensity.value,
        0.0,
        0.02
      );
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 20, 0.01);
    }
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width, viewport.height]}
      position={[0, 0, -5]}
      material={dollyMaterial}
    />
  );
}

// Dynamic Zoom Effects
function DynamicZoomEffect({ 
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

  const zoomMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uBeat: { value: 0 },
        uZoomCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uZoomIntensity: { value: 1.0 }
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
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uBeat;
        uniform vec2 uZoomCenter;
        uniform float uZoomIntensity;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          
          // Dynamic zoom center based on frequency content
          vec2 center = uZoomCenter;
          center.x += sin(uTime * 2.0 + uTreble * 10.0) * uTreble * 0.1;
          center.y += cos(uTime * 1.5 + uMid * 8.0) * uMid * 0.1;
          
          // Zoom effect
          vec2 toCenter = uv - center;
          uv = center + toCenter * uZoomIntensity;
          
          // Beat-based zoom pulse
          if (uBeat > 0.7) {
            float pulse = sin(uTime * 20.0) * uBeat * 0.05;
            uv = center + toCenter * (uZoomIntensity + pulse);
          }
          
          // Bass-driven radial zoom
          float distance = length(toCenter);
          float bassZoom = sin(distance * 10.0 - uTime * 5.0) * uBass * 0.02;
          uv = center + toCenter * (uZoomIntensity + bassZoom);
          
          vec4 color = texture2D(uTexture, uv);
          
          // Treble-based edge enhancement
          if (uTreble > 0.5) {
            vec2 offset = vec2(0.001) * uTreble;
            vec4 edge = texture2D(uTexture, uv + offset) - texture2D(uTexture, uv - offset);
            color.rgb += edge.rgb * uTreble * 0.5;
          }
          
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
    zoomMaterial.uniforms.uTime.value += delta;
    zoomMaterial.uniforms.uBass.value = audioData.bass;
    zoomMaterial.uniforms.uMid.value = audioData.mid;
    zoomMaterial.uniforms.uTreble.value = audioData.treble;
    zoomMaterial.uniforms.uBeat.value = beatIntensity;

    // Dynamic zoom intensity based on energy
    const targetZoom = 0.8 + energy * 0.4;
    zoomMaterial.uniforms.uZoomIntensity.value = THREE.MathUtils.lerp(
      zoomMaterial.uniforms.uZoomIntensity.value,
      targetZoom,
      0.05
    );

    // Beat-responsive zoom center movement
    if (beatIntensity > 0.6) {
      const newCenter = new THREE.Vector2(
        0.5 + (Math.random() - 0.5) * beatIntensity * 0.2,
        0.5 + (Math.random() - 0.5) * beatIntensity * 0.2
      );
      zoomMaterial.uniforms.uZoomCenter.value.lerp(newCenter, 0.1);
    } else {
      zoomMaterial.uniforms.uZoomCenter.value.lerp(new THREE.Vector2(0.5, 0.5), 0.02);
    }
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width * 1.1, viewport.height * 1.1]}
      position={[0, 0, -8]}
      material={zoomMaterial}
    />
  );
}

// Frequency-based Zoom Burst Effect
function FrequencyZoomBurst({
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

  const burstMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uBassZoom: { value: 1.0 },
        uMidZoom: { value: 1.0 },
        uTrebleZoom: { value: 1.0 },
        uBeat: { value: 0.0 },
        uVocalDetection: { value: 0.0 }
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
        uniform float uBassZoom;
        uniform float uMidZoom;
        uniform float uTrebleZoom;
        uniform float uBeat;
        uniform float uVocalDetection;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.5);
          vec2 toCenter = uv - center;

          // Multi-frequency zoom layers
          // Bass creates slow, deep zoom
          vec2 bassUV = center + toCenter * (1.0 / uBassZoom);

          // Mid creates medium zoom with vocal detection
          float midZoomFactor = uMidZoom * (1.0 + uVocalDetection * 0.3);
          vec2 midUV = center + toCenter * (1.0 / midZoomFactor);

          // Treble creates fast, sharp zoom bursts
          float trebleZoomFactor = uTrebleZoom;
          if (uBeat > 0.8) {
            trebleZoomFactor *= 1.0 + sin(uTime * 30.0) * 0.2;
          }
          vec2 trebleUV = center + toCenter * (1.0 / trebleZoomFactor);

          // Sample texture at different zoom levels
          vec4 bassColor = texture2D(uTexture, bassUV);
          vec4 midColor = texture2D(uTexture, midUV);
          vec4 trebleColor = texture2D(uTexture, trebleUV);

          // Blend based on frequency dominance
          vec4 color = bassColor * 0.4 + midColor * 0.4 + trebleColor * 0.2;

          // Vocal presence creates center focus
          if (uVocalDetection > 0.4) {
            float distance = length(toCenter);
            float vocalFocus = 1.0 - smoothstep(0.0, 0.5, distance);
            color.rgb *= 1.0 + vocalFocus * uVocalDetection * 0.5;
          }

          gl_FragColor = color;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData || !meshRef.current) return;

    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Vocal detection (high mid + treble, low bass)
    const vocalDetection = Math.max(0, (audioData.mid * 0.7 + audioData.treble * 0.3) - audioData.bass * 0.4);

    // Update uniforms
    burstMaterial.uniforms.uTime.value += delta;
    burstMaterial.uniforms.uBeat.value = beatIntensity;
    burstMaterial.uniforms.uVocalDetection.value = vocalDetection;

    // Bass zoom - slow and deep
    const targetBassZoom = 0.9 + audioData.bass * 0.3;
    burstMaterial.uniforms.uBassZoom.value = THREE.MathUtils.lerp(
      burstMaterial.uniforms.uBassZoom.value,
      targetBassZoom,
      0.02
    );

    // Mid zoom - responsive to vocals
    const targetMidZoom = 0.95 + audioData.mid * 0.2 + vocalDetection * 0.15;
    burstMaterial.uniforms.uMidZoom.value = THREE.MathUtils.lerp(
      burstMaterial.uniforms.uMidZoom.value,
      targetMidZoom,
      0.05
    );

    // Treble zoom - fast and sharp
    const targetTrebleZoom = 0.98 + audioData.treble * 0.1 + beatIntensity * 0.1;
    burstMaterial.uniforms.uTrebleZoom.value = THREE.MathUtils.lerp(
      burstMaterial.uniforms.uTrebleZoom.value,
      targetTrebleZoom,
      0.1
    );
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width * 1.2, viewport.height * 1.2]}
      position={[0, 0, -6]}
      material={burstMaterial}
    />
  );
}

export default function CinematicEffects({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: CinematicEffectsProps) {
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
      {/* Dolly Zoom Effect */}
      <DollyZoomEffect
        texture={texture}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Dynamic Zoom Effect */}
      <DynamicZoomEffect
        texture={texture}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />

      {/* Frequency Zoom Burst Effect */}
      <FrequencyZoomBurst
        texture={texture}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />
    </group>
  );
}
