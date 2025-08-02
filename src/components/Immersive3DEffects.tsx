'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';

interface Immersive3DEffectsProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

// 3D Tunnel Effect
function TunnelEffect({ 
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
  const tunnelRefs = useRef<THREE.Mesh[]>([]);
  const { viewport } = useThree();
  const segmentCount = 8;

  const tunnelMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uBeat: { value: 0 },
        uDepth: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uBass;
        uniform float uDepth;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Create tunnel perspective
          float tunnelEffect = 1.0 - (uDepth * 0.1);
          pos.xy *= tunnelEffect;
          
          // Bass-driven tunnel expansion
          pos.xy *= 1.0 + uBass * 0.3;
          
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
        uniform float uDepth;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          
          // Tunnel UV distortion
          vec2 center = vec2(0.5);
          vec2 toCenter = center - uv;
          float distance = length(toCenter);
          
          // Create tunnel perspective distortion
          uv += toCenter * distance * uDepth * 0.1;
          
          // Beat-based tunnel pulse
          uv += toCenter * uBeat * 0.05;
          
          vec4 color = texture2D(uTexture, uv);
          
          // Depth-based opacity
          float opacity = 1.0 - (uDepth * 0.15);
          color.a = opacity;
          
          gl_FragColor = color;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    tunnelRefs.current.forEach((segment, i) => {
      if (!segment) return;

      const material = segment.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value += delta;
      material.uniforms.uBass.value = audioData.bass;
      material.uniforms.uMid.value = audioData.mid;
      material.uniforms.uTreble.value = audioData.treble;
      material.uniforms.uBeat.value = beatIntensity;
      material.uniforms.uDepth.value = i;

      // Move segments through tunnel
      segment.position.z += delta * (10 + energy * 20);
      
      // Reset position when segment goes too far
      if (segment.position.z > 20) {
        segment.position.z = -50;
      }

      // 3D perspective scaling
      const scale = 1 + (segment.position.z + 50) * 0.02;
      segment.scale.setScalar(scale);
    });
  });

  if (!texture) return null;

  return (
    <group>
      {Array.from({ length: segmentCount }, (_, i) => (
        <Plane
          key={i}
          ref={(ref) => {
            if (ref) tunnelRefs.current[i] = ref;
          }}
          args={[viewport.width, viewport.height]}
          position={[0, 0, -50 + i * 10]}
          material={tunnelMaterial.clone()}
        />
      ))}
    </group>
  );
}

// 3D Sphere Mapping Effect
function SphereMappingEffect({ 
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
  const sphereRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const sphereMaterial = useMemo(() => {
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
        varying vec3 vPosition;
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          vec3 pos = position;
          
          // Bass-driven sphere deformation
          float deformation = sin(pos.x * 3.0 + uTime) * cos(pos.y * 2.0 + uTime) * uBass * 0.3;
          pos += normal * deformation;
          
          // Mid-frequency ripples
          float ripple = sin(length(pos.xy) * 5.0 - uTime * 3.0) * uMid * 0.2;
          pos += normal * ripple;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uTreble;
        uniform float uBeat;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec2 uv = vUv;
          
          // Spherical UV mapping with treble distortion
          uv += sin(vPosition.xyz * 10.0 + uTime * 2.0).xy * uTreble * 0.02;
          
          vec4 color = texture2D(uTexture, uv);
          
          // Beat-based brightness
          color.rgb *= 1.0 + uBeat * 0.5;
          
          // Transparency based on position
          float alpha = 0.7 + sin(length(vPosition.xy) * 2.0 + uTime) * 0.3;
          color.a = alpha;
          
          gl_FragColor = color;
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, [texture]);

  useFrame((state, delta) => {
    if (!audioData || !sphereRef.current) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    const material = sphereRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value += delta;
    material.uniforms.uBass.value = audioData.bass;
    material.uniforms.uMid.value = audioData.mid;
    material.uniforms.uTreble.value = audioData.treble;
    material.uniforms.uBeat.value = beatIntensity;

    // 3D sphere movement
    sphereRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * energy * 3;
    sphereRef.current.position.y = Math.cos(state.clock.elapsedTime * 0.3) * energy * 2;
    sphereRef.current.position.z = -15 + Math.sin(state.clock.elapsedTime * 0.7) * energy * 5;

    // Beat-responsive scaling
    const scale = 8 + beatIntensity * 3;
    sphereRef.current.scale.setScalar(scale);

    // Continuous 3D rotation for immersion
    sphereRef.current.rotation.x += delta * energy * 0.3;
    sphereRef.current.rotation.y += delta * energy * 0.2;
  });

  if (!texture) return null;

  return (
    <mesh ref={sphereRef} position={[0, 0, -15]}>
      <sphereGeometry args={[8, 32, 32]} />
      <primitive object={sphereMaterial} />
    </mesh>
  );
}

export default function Immersive3DEffects({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: Immersive3DEffectsProps) {
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
      {/* Tunnel Effect for electronic/energetic music */}
      {musicCharacteristics?.genre === 'electronic' || musicCharacteristics?.mood === 'energetic' ? (
        <TunnelEffect
          texture={texture}
          audioData={audioData}
          beatData={beatData}
          musicCharacteristics={musicCharacteristics}
        />
      ) : (
        /* Sphere Mapping for other genres */
        <SphereMappingEffect
          texture={texture}
          audioData={audioData}
          beatData={beatData}
          musicCharacteristics={musicCharacteristics}
        />
      )}
    </group>
  );
}
