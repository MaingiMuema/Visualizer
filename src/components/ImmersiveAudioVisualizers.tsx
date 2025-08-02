'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Points, Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';

interface ImmersiveAudioVisualizersProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

// Frequency-responsive particle system
function FrequencyParticles({ 
  audioData, 
  beatData, 
  musicCharacteristics 
}: {
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 2000;

  // Create particle positions and attributes
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a sphere
      const radius = Math.random() * 50 + 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Initial colors
      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();

      sizes[i] = Math.random() * 2 + 1;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !audioData) return;

    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.attributes.position;
    const colorAttribute = geometry.attributes.color;
    const sizeAttribute = geometry.attributes.size;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Animate particles based on frequency bands
      const bassInfluence = audioData.bass * Math.sin(state.clock.elapsedTime * 2 + i * 0.01);
      const midInfluence = audioData.mid * Math.cos(state.clock.elapsedTime * 3 + i * 0.02);
      const trebleInfluence = audioData.treble * Math.sin(state.clock.elapsedTime * 4 + i * 0.03);

      // Update positions with audio influence
      positionAttribute.array[i3] += bassInfluence * 0.1;
      positionAttribute.array[i3 + 1] += midInfluence * 0.1;
      positionAttribute.array[i3 + 2] += trebleInfluence * 0.1;

      // Update colors based on frequency bands
      colorAttribute.array[i3] = audioData.bass + Math.sin(state.clock.elapsedTime + i * 0.1) * 0.5;
      colorAttribute.array[i3 + 1] = audioData.mid + Math.cos(state.clock.elapsedTime + i * 0.2) * 0.5;
      colorAttribute.array[i3 + 2] = audioData.treble + Math.sin(state.clock.elapsedTime + i * 0.3) * 0.5;

      // Update sizes based on beat and energy
      sizeAttribute.array[i] = (1 + energy * 2) * (1 + beatIntensity * 3);
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    sizeAttribute.needsUpdate = true;

    // Rotate the entire particle system
    pointsRef.current.rotation.y += delta * energy * 0.5;
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
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Beat-responsive geometric shapes
function BeatGeometry({ 
  audioData, 
  beatData, 
  musicCharacteristics 
}: {
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRefs = useRef<THREE.Mesh[]>([]);
  const boxRefs = useRef<THREE.Mesh[]>([]);

  // Create multiple geometric shapes
  const shapes = useMemo(() => {
    const spheres = [];
    const boxes = [];

    for (let i = 0; i < 20; i++) {
      spheres.push({
        position: [
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        ],
        scale: Math.random() * 2 + 0.5
      });
    }

    for (let i = 0; i < 15; i++) {
      boxes.push({
        position: [
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 80
        ],
        scale: Math.random() * 1.5 + 0.3
      });
    }

    return { spheres, boxes };
  }, []);

  useFrame((state, delta) => {
    if (!audioData) return;

    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Animate spheres based on bass
    sphereRefs.current.forEach((sphere, index) => {
      if (sphere) {
        const bassScale = 1 + audioData.bass * 2 + beatIntensity * 3;
        sphere.scale.setScalar(bassScale * shapes.spheres[index].scale);
        
        // Color based on mood
        const material = sphere.material as THREE.MeshStandardMaterial;
        if (musicCharacteristics?.mood === 'energetic') {
          material.color.setRGB(1, 0.5 + audioData.bass * 0.5, 0);
        } else if (musicCharacteristics?.mood === 'dark') {
          material.color.setRGB(0.3 + audioData.bass * 0.3, 0.1, 0.5 + audioData.bass * 0.5);
        } else {
          material.color.setRGB(audioData.bass, audioData.mid, audioData.treble);
        }

        // Rotation
        sphere.rotation.x += delta * audioData.bass * 2;
        sphere.rotation.y += delta * energy;
      }
    });

    // Animate boxes based on treble
    boxRefs.current.forEach((box, index) => {
      if (box) {
        const trebleScale = 1 + audioData.treble * 1.5 + beatIntensity * 2;
        box.scale.setScalar(trebleScale * shapes.boxes[index].scale);
        
        // Color and rotation
        const material = box.material as THREE.MeshStandardMaterial;
        material.color.setRGB(audioData.treble, audioData.mid * 0.8, audioData.bass * 0.6);
        
        box.rotation.x += delta * audioData.treble * 3;
        box.rotation.z += delta * audioData.mid * 2;
      }
    });

    // Group rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * energy * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {shapes.spheres.map((sphere, index) => (
        <Sphere
          key={`sphere-${index}`}
          ref={(ref) => { if (ref) sphereRefs.current[index] = ref; }}
          position={sphere.position as [number, number, number]}
          args={[1, 16, 16]}
        >
          <meshStandardMaterial
            color="#ff6b6b"
            transparent
            opacity={0.7}
            emissive="#330000"
          />
        </Sphere>
      ))}
      
      {shapes.boxes.map((box, index) => (
        <Box
          key={`box-${index}`}
          ref={(ref) => { if (ref) boxRefs.current[index] = ref; }}
          position={box.position as [number, number, number]}
          args={[1, 1, 1]}
        >
          <meshStandardMaterial
            color="#4ecdc4"
            transparent
            opacity={0.6}
            emissive="#003333"
          />
        </Box>
      ))}
    </group>
  );
}

export default function ImmersiveAudioVisualizers({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: ImmersiveAudioVisualizersProps) {
  return (
    <group>
      {/* Frequency-responsive particles */}
      <FrequencyParticles
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />
      
      {/* Beat-responsive geometry */}
      <BeatGeometry
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />
    </group>
  );
}
