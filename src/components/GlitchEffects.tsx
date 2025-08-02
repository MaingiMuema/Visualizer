'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';

interface GlitchEffectsProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
}

// Digital Glitch Effect
function DigitalGlitchEffect({ 
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

  const glitchMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uGlitchIntensity: { value: 0.0 },
        uDigitalNoise: { value: 0.0 },
        uDatamosh: { value: 0.0 },
        uScanlines: { value: 0.0 },
        uBeat: { value: 0.0 },
        uTreble: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uGlitchIntensity;
        uniform float uBeat;
        
        // Random function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Beat-based vertex displacement glitch
          if (uBeat > 0.8) {
            float glitch = random(vec2(pos.x, uTime)) * 2.0 - 1.0;
            pos.x += glitch * uGlitchIntensity * 0.1;
            pos.y += random(vec2(pos.y, uTime + 1.0)) * uGlitchIntensity * 0.05;
          }
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uGlitchIntensity;
        uniform float uDigitalNoise;
        uniform float uDatamosh;
        uniform float uScanlines;
        uniform float uBeat;
        uniform float uTreble;
        varying vec2 vUv;
        
        // Random function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        // Noise function
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Digital glitch displacement
          if (uGlitchIntensity > 0.1) {
            float glitchTime = floor(uTime * 30.0) / 30.0; // Quantized time for digital feel
            float glitchRow = floor(uv.y * 100.0) / 100.0;
            
            if (random(vec2(glitchRow, glitchTime)) > 0.9) {
              uv.x += (random(vec2(glitchRow, glitchTime + 1.0)) - 0.5) * uGlitchIntensity * 0.1;
            }
          }
          
          // RGB shift glitch
          vec4 color;
          if (uBeat > 0.7) {
            float shift = uBeat * 0.01;
            color.r = texture2D(uTexture, uv + vec2(shift, 0.0)).r;
            color.g = texture2D(uTexture, uv).g;
            color.b = texture2D(uTexture, uv - vec2(shift, 0.0)).b;
            color.a = 1.0;
          } else {
            color = texture2D(uTexture, uv);
          }
          
          // Digital noise overlay
          if (uDigitalNoise > 0.1) {
            float digitalPattern = step(0.5, noise(uv * 200.0 + uTime * 10.0));
            color.rgb = mix(color.rgb, vec3(digitalPattern), uDigitalNoise * 0.3);
          }
          
          // Datamosh effect
          if (uDatamosh > 0.2) {
            vec2 datamoshUV = uv;
            datamoshUV.x += sin(uv.y * 50.0 + uTime * 5.0) * uDatamosh * 0.02;
            vec4 datamoshColor = texture2D(uTexture, datamoshUV);
            color = mix(color, datamoshColor, uDatamosh * 0.5);
          }
          
          // Scanlines
          if (uScanlines > 0.1) {
            float scanline = sin(uv.y * 800.0) * 0.5 + 0.5;
            color.rgb *= 1.0 - scanline * uScanlines * 0.3;
          }
          
          // Treble-based pixelation
          if (uTreble > 0.6) {
            float pixelSize = 1.0 + uTreble * 50.0;
            vec2 pixelUV = floor(uv * pixelSize) / pixelSize;
            color = mix(color, texture2D(uTexture, pixelUV), uTreble * 0.7);
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

    // Update uniforms
    glitchMaterial.uniforms.uTime.value += delta;
    glitchMaterial.uniforms.uBeat.value = beatIntensity;
    glitchMaterial.uniforms.uTreble.value = audioData.treble;

    // Glitch intensity based on genre and energy
    let targetGlitch = 0;
    if (musicCharacteristics?.genre === 'electronic') {
      targetGlitch = energy * 0.8 + beatIntensity * 0.5;
    } else if (musicCharacteristics?.mood === 'aggressive') {
      targetGlitch = energy * 0.6 + beatIntensity * 0.7;
    } else {
      targetGlitch = beatIntensity * 0.3;
    }

    glitchMaterial.uniforms.uGlitchIntensity.value = THREE.MathUtils.lerp(
      glitchMaterial.uniforms.uGlitchIntensity.value,
      targetGlitch,
      0.1
    );

    // Digital noise based on treble
    glitchMaterial.uniforms.uDigitalNoise.value = THREE.MathUtils.lerp(
      glitchMaterial.uniforms.uDigitalNoise.value,
      audioData.treble * 0.8,
      0.05
    );

    // Datamosh effect based on mid frequencies
    glitchMaterial.uniforms.uDatamosh.value = THREE.MathUtils.lerp(
      glitchMaterial.uniforms.uDatamosh.value,
      audioData.mid * 0.6,
      0.03
    );

    // Scanlines based on bass
    glitchMaterial.uniforms.uScanlines.value = THREE.MathUtils.lerp(
      glitchMaterial.uniforms.uScanlines.value,
      audioData.bass * 0.5,
      0.02
    );
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width, viewport.height]}
      position={[0, 0, -12]}
      material={glitchMaterial}
    />
  );
}

// Analog Glitch Effect (VHS/Tape style)
function AnalogGlitchEffect({ 
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

  const analogMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uVHSIntensity: { value: 0.0 },
        uTapeWobble: { value: 0.0 },
        uColorBleed: { value: 0.0 },
        uStaticNoise: { value: 0.0 },
        uBass: { value: 0.0 },
        uMid: { value: 0.0 }
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
        uniform float uVHSIntensity;
        uniform float uTapeWobble;
        uniform float uColorBleed;
        uniform float uStaticNoise;
        uniform float uBass;
        uniform float uMid;
        varying vec2 vUv;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec2 uv = vUv;
          
          // VHS tape wobble
          if (uTapeWobble > 0.1) {
            uv.x += sin(uv.y * 10.0 + uTime * 2.0) * uTapeWobble * 0.01;
            uv.y += sin(uv.x * 15.0 + uTime * 1.5) * uTapeWobble * 0.005;
          }
          
          // Bass-driven horizontal displacement (tape stretch)
          if (uBass > 0.3) {
            float bassWave = sin(uv.y * 20.0 + uTime * 3.0) * uBass * 0.02;
            uv.x += bassWave;
          }
          
          vec4 color = texture2D(uTexture, uv);
          
          // Color bleeding/separation
          if (uColorBleed > 0.2) {
            float bleed = uColorBleed * 0.005;
            color.r = texture2D(uTexture, uv + vec2(bleed, 0.0)).r;
            color.b = texture2D(uTexture, uv - vec2(bleed, 0.0)).b;
          }
          
          // Static noise overlay
          if (uStaticNoise > 0.1) {
            float noise = random(uv + uTime) * 2.0 - 1.0;
            color.rgb += noise * uStaticNoise * 0.1;
          }
          
          // VHS color degradation
          if (uVHSIntensity > 0.2) {
            // Reduce color saturation
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = mix(color.rgb, vec3(gray), uVHSIntensity * 0.3);
            
            // Add VHS color tint
            color.r *= 1.0 + uVHSIntensity * 0.1;
            color.g *= 1.0 - uVHSIntensity * 0.05;
            color.b *= 1.0 - uVHSIntensity * 0.1;
          }
          
          // Mid-frequency tracking errors
          if (uMid > 0.5) {
            float trackingError = step(0.98, random(vec2(floor(uv.y * 100.0), floor(uTime * 10.0))));
            if (trackingError > 0.5) {
              uv.x += (random(vec2(uv.y, uTime)) - 0.5) * uMid * 0.1;
              color = texture2D(uTexture, uv);
            }
          }
          
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

    // Update uniforms
    analogMaterial.uniforms.uTime.value += delta;
    analogMaterial.uniforms.uBass.value = audioData.bass;
    analogMaterial.uniforms.uMid.value = audioData.mid;

    // VHS intensity based on genre
    let targetVHS = 0;
    if (musicCharacteristics?.genre === 'rock' || musicCharacteristics?.mood === 'dark') {
      targetVHS = energy * 0.7;
    } else {
      targetVHS = energy * 0.3;
    }

    analogMaterial.uniforms.uVHSIntensity.value = THREE.MathUtils.lerp(
      analogMaterial.uniforms.uVHSIntensity.value,
      targetVHS,
      0.02
    );

    // Tape wobble based on bass
    analogMaterial.uniforms.uTapeWobble.value = THREE.MathUtils.lerp(
      analogMaterial.uniforms.uTapeWobble.value,
      audioData.bass * 0.8,
      0.05
    );

    // Color bleed based on mid frequencies
    analogMaterial.uniforms.uColorBleed.value = THREE.MathUtils.lerp(
      analogMaterial.uniforms.uColorBleed.value,
      audioData.mid * 0.6,
      0.03
    );

    // Static noise based on treble
    analogMaterial.uniforms.uStaticNoise.value = THREE.MathUtils.lerp(
      analogMaterial.uniforms.uStaticNoise.value,
      audioData.treble * 0.5,
      0.08
    );
  });

  if (!texture) return null;

  return (
    <Plane
      ref={meshRef}
      args={[viewport.width, viewport.height]}
      position={[0, 0, -14]}
      material={analogMaterial}
    />
  );
}

export default function GlitchEffects({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics
}: GlitchEffectsProps) {
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
      {/* Digital Glitch Effect */}
      <DigitalGlitchEffect
        texture={texture}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />
      
      {/* Analog Glitch Effect */}
      <AnalogGlitchEffect
        texture={texture}
        audioData={audioData}
        beatData={beatData}
        musicCharacteristics={musicCharacteristics}
      />
    </group>
  );
}
