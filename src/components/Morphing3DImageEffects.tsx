'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { Plane, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { AudioAnalysisData } from '../utils/audioAnalyzer';
import { BeatData } from '../utils/beatDetector';
import { MusicCharacteristics } from '../utils/storyThemeEngine';
import { GeneratedImage } from '../utils/pollinationsAI';

// Advanced morphing shader material
const MorphingImageMaterial = shaderMaterial(
  {
    uTexture: null,
    uTime: 0,
    uBass: 0,
    uMid: 0,
    uTreble: 0,
    uBeat: 0,
    uEnergy: 0,
    uResolution: new THREE.Vector2(1, 1),
    uMorphIntensity: 1.0,
    uWaveAmplitude: 0.5,
    uTwistAmount: 0.0,
    uBulgeAmount: 0.0,
    uRippleFrequency: 5.0,
    uColorMorph: 0.0,
    uPixelation: 0.0,
    uKaleidoscope: 0.0,
    uMoodColor: new THREE.Vector3(1, 1, 1),
  },
  // Vertex shader with advanced morphing
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform float uBeat;
    uniform float uMorphIntensity;
    uniform float uWaveAmplitude;
    uniform float uTwistAmount;
    uniform float uBulgeAmount;
    uniform float uRippleFrequency;
    
    // Noise functions
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 permute(vec4 x) {
      return mod289(((x*34.0)+1.0)*x);
    }
    
    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod289(i);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;
      
      vec3 pos = position;
      
      // Bass-driven wave morphing
      float bassWave = sin(pos.x * uRippleFrequency + uTime * 3.0) * 
                       cos(pos.y * uRippleFrequency * 0.7 + uTime * 2.0);
      pos.z += bassWave * uBass * uWaveAmplitude * uMorphIntensity;
      
      // Mid-frequency bulge effect
      float distanceFromCenter = length(pos.xy);
      float bulge = sin(distanceFromCenter * 3.0 - uTime * 2.0) * uMid * uBulgeAmount;
      pos.z += bulge * uMorphIntensity;
      
      // Treble-based twist effect
      float angle = atan(pos.y, pos.x);
      float twist = uTreble * uTwistAmount * sin(distanceFromCenter * 2.0 + uTime);
      float cosAngle = cos(angle + twist);
      float sinAngle = sin(angle + twist);
      
      if (uTwistAmount > 0.0) {
        pos.x = distanceFromCenter * cosAngle;
        pos.y = distanceFromCenter * sinAngle;
      }
      
      // Beat-responsive explosion effect
      if (uBeat > 0.7) {
        float explosionForce = uBeat * sin(uTime * 20.0) * 0.3;
        pos += normalize(pos) * explosionForce * uMorphIntensity;
      }
      
      // Noise-based organic morphing
      float noise = snoise(vec3(pos.xy * 2.0, uTime * 0.5));
      pos.z += noise * uMid * 0.2 * uMorphIntensity;
      
      // Energy-based overall scaling
      float energyScale = 1.0 + (uBass + uMid + uTreble) * 0.1 * uMorphIntensity;
      pos *= energyScale;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader with advanced effects
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform float uBeat;
    uniform float uEnergy;
    uniform vec2 uResolution;
    uniform float uColorMorph;
    uniform float uPixelation;
    uniform float uKaleidoscope;
    uniform vec3 uMoodColor;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
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
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Kaleidoscope effect
    vec2 kaleidoscope(vec2 uv, float segments) {
      float angle = atan(uv.y - 0.5, uv.x - 0.5);
      float radius = length(uv - 0.5);
      
      angle = mod(angle, 2.0 * 3.14159 / segments);
      if (mod(floor(angle / (2.0 * 3.14159 / segments)), 2.0) == 1.0) {
        angle = 2.0 * 3.14159 / segments - angle;
      }
      
      return vec2(cos(angle), sin(angle)) * radius + 0.5;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Pixelation effect for electronic music
      if (uPixelation > 0.0) {
        float pixelSize = 1.0 + uPixelation * 50.0;
        uv = floor(uv * pixelSize) / pixelSize;
      }
      
      // Kaleidoscope effect
      if (uKaleidoscope > 0.0) {
        float segments = 6.0 + uKaleidoscope * 12.0;
        uv = kaleidoscope(uv, segments);
      }
      
      // Dynamic UV distortion based on audio
      vec2 distortion = vec2(
        sin(uv.y * 15.0 + uTime * 3.0) * uBass * 0.03,
        cos(uv.x * 12.0 + uTime * 2.5) * uTreble * 0.03
      );
      
      // Mid-frequency spiral distortion
      float angle = atan(uv.y - 0.5, uv.x - 0.5);
      float radius = length(uv - 0.5);
      float spiral = sin(angle * 8.0 + radius * 20.0 - uTime * 4.0) * uMid * 0.02;
      distortion += vec2(cos(angle), sin(angle)) * spiral;
      
      // Beat-based screen shake
      vec2 shake = vec2(
        sin(uTime * 40.0) * uBeat * 0.008,
        cos(uTime * 35.0) * uBeat * 0.008
      );
      
      vec2 finalUV = uv + distortion + shake;
      
      // Sample the texture
      vec4 color = texture2D(uTexture, finalUV);
      
      // Color morphing based on frequencies
      if (uColorMorph > 0.0) {
        // Bass affects red channel
        color.r += sin(uTime * 2.0 + uBass * 8.0) * uColorMorph * 0.2;
        // Mid affects green channel
        color.g += sin(uTime * 1.5 + uMid * 6.0) * uColorMorph * 0.2;
        // Treble affects blue channel
        color.b += sin(uTime * 2.5 + uTreble * 10.0) * uColorMorph * 0.2;
      }
      
      // Mood-based color grading
      color.rgb = mix(color.rgb, color.rgb * uMoodColor, 0.4);
      
      // Energy-based brightness and contrast
      float energyBoost = 1.0 + uEnergy * 0.6;
      color.rgb *= energyBoost;
      
      // Beat flash with color
      float beatFlash = uBeat * sin(uTime * 25.0) * 0.15;
      color.rgb += vec3(beatFlash * uMoodColor);
      
      // Frequency-based edge enhancement
      vec2 texelSize = 1.0 / uResolution;
      vec4 edge = texture2D(uTexture, finalUV + vec2(texelSize.x, 0.0)) +
                  texture2D(uTexture, finalUV - vec2(texelSize.x, 0.0)) +
                  texture2D(uTexture, finalUV + vec2(0.0, texelSize.y)) +
                  texture2D(uTexture, finalUV - vec2(0.0, texelSize.y)) -
                  4.0 * color;
      
      color.rgb += edge.rgb * uTreble * 0.3;
      
      // Organic noise overlay
      float organicNoise = noise(uv * 100.0 + uTime * 5.0);
      color.rgb += vec3(organicNoise * uMid * 0.1);
      
      // Vignette effect that pulses with bass
      float vignette = smoothstep(0.0, 1.0, 1.0 - length(uv - 0.5) * (1.5 + uBass * 0.5));
      color.rgb *= vignette;
      
      gl_FragColor = color;
    }
  `
);

extend({ MorphingImageMaterial });

interface Morphing3DImageEffectsProps {
  backgroundImage: GeneratedImage | null;
  audioData: AudioAnalysisData | null;
  beatData: BeatData | null;
  musicCharacteristics: MusicCharacteristics | null;
  width?: number;
  height?: number;
}

export default function Morphing3DImageEffects({
  backgroundImage,
  audioData,
  beatData,
  musicCharacteristics,
  width = 1920,
  height = 1080
}: Morphing3DImageEffectsProps) {
  const materialRef = useRef<any>();
  const planeRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  // Load texture with cropping preference
  const texture = useMemo(() => {
    if (!backgroundImage) return null;
    
    // Use cropped URL if available, otherwise use original
    const imageUrl = backgroundImage.croppedUrl || backgroundImage.url;
    
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      return null;
    }
    
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [backgroundImage]);

  // Get mood color and effects based on music characteristics
  const { moodColor, morphSettings } = useMemo(() => {
    if (!musicCharacteristics) {
      return {
        moodColor: new THREE.Vector3(1, 1, 1),
        morphSettings: {
          morphIntensity: 1.0,
          waveAmplitude: 0.5,
          twistAmount: 0.0,
          bulgeAmount: 0.0,
          colorMorph: 0.3,
          pixelation: 0.0,
          kaleidoscope: 0.0
        }
      };
    }
    
    let color = new THREE.Vector3(1, 1, 1);
    let settings = {
      morphIntensity: 1.0,
      waveAmplitude: 0.5,
      twistAmount: 0.0,
      bulgeAmount: 0.0,
      colorMorph: 0.3,
      pixelation: 0.0,
      kaleidoscope: 0.0
    };

    switch (musicCharacteristics.mood) {
      case 'energetic':
        color = new THREE.Vector3(1.3, 0.9, 0.7);
        settings.morphIntensity = 1.5;
        settings.waveAmplitude = 0.8;
        settings.twistAmount = 0.3;
        settings.colorMorph = 0.6;
        break;
      case 'calm':
        color = new THREE.Vector3(0.8, 0.9, 1.2);
        settings.morphIntensity = 0.6;
        settings.waveAmplitude = 0.3;
        settings.bulgeAmount = 0.4;
        settings.colorMorph = 0.2;
        break;
      case 'dark':
        color = new THREE.Vector3(0.6, 0.4, 0.9);
        settings.morphIntensity = 1.2;
        settings.twistAmount = 0.5;
        settings.colorMorph = 0.8;
        break;
      case 'aggressive':
        color = new THREE.Vector3(1.4, 0.5, 0.5);
        settings.morphIntensity = 2.0;
        settings.waveAmplitude = 1.0;
        settings.twistAmount = 0.7;
        settings.colorMorph = 1.0;
        break;
    }

    // Genre-specific effects
    switch (musicCharacteristics.genre) {
      case 'electronic':
        settings.pixelation = 0.3;
        settings.kaleidoscope = 0.2;
        break;
      case 'rock':
        settings.morphIntensity *= 1.3;
        settings.waveAmplitude *= 1.2;
        break;
      case 'ambient':
        settings.bulgeAmount = 0.6;
        settings.morphIntensity = 0.8;
        break;
    }

    return { moodColor: color, morphSettings: settings };
  }, [musicCharacteristics]);

  // Update shader uniforms
  useFrame((state, delta) => {
    if (!materialRef.current || !audioData) return;

    const material = materialRef.current;
    const energy = (audioData.bass + audioData.mid + audioData.treble) / 3;
    const beatIntensity = beatData?.isBeat ? beatData.confidence : 0;

    // Update time
    material.uTime += delta;

    // Update audio data
    material.uBass = audioData.bass;
    material.uMid = audioData.mid;
    material.uTreble = audioData.treble;
    material.uBeat = beatIntensity;
    material.uEnergy = energy;

    // Update mood color
    material.uMoodColor = moodColor;

    // Update morph settings
    material.uMorphIntensity = morphSettings.morphIntensity;
    material.uWaveAmplitude = morphSettings.waveAmplitude;
    material.uTwistAmount = morphSettings.twistAmount;
    material.uBulgeAmount = morphSettings.bulgeAmount;
    material.uColorMorph = morphSettings.colorMorph;
    material.uPixelation = morphSettings.pixelation;
    material.uKaleidoscope = morphSettings.kaleidoscope;

    // Dynamic ripple frequency based on tempo
    if (musicCharacteristics) {
      material.uRippleFrequency = 3.0 + (musicCharacteristics.tempo / 120) * 5.0;
    }

    // Beat-responsive 3D transformation
    if (planeRef.current) {
      if (beatIntensity > 0.6) {
        const scale = 1 + beatIntensity * 0.08;
        planeRef.current.scale.setScalar(scale);

        // 3D perspective tilt based on beat
        planeRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * beatIntensity * 0.3;
        planeRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 8) * beatIntensity * 0.2;

        // Dynamic depth movement
        planeRef.current.position.z = -10 + Math.sin(state.clock.elapsedTime * 15) * beatIntensity * 3;
      } else {
        planeRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        planeRef.current.rotation.x = THREE.MathUtils.lerp(planeRef.current.rotation.x, 0, 0.1);
        planeRef.current.rotation.y = THREE.MathUtils.lerp(planeRef.current.rotation.y, 0, 0.1);
        planeRef.current.position.z = THREE.MathUtils.lerp(planeRef.current.position.z, -10, 0.1);
      }

      // Energy-based 3D wave motion
      const waveX = Math.sin(state.clock.elapsedTime * 2 + energy * 5) * energy * 0.15;
      const waveY = Math.cos(state.clock.elapsedTime * 1.5 + energy * 3) * energy * 0.1;
      planeRef.current.rotation.x += waveX;
      planeRef.current.rotation.y += waveY;

      // Frequency-based perspective shifts
      if (audioData) {
        // Bass creates horizontal perspective shifts
        planeRef.current.rotation.y += Math.sin(state.clock.elapsedTime * 3) * audioData.bass * 0.2;

        // Treble creates vertical perspective shifts
        planeRef.current.rotation.x += Math.cos(state.clock.elapsedTime * 4) * audioData.treble * 0.15;

        // Mid frequencies create depth oscillation
        planeRef.current.position.z += Math.sin(state.clock.elapsedTime * 2.5) * audioData.mid * 2;
      }
    }
  });

  // Update texture when it changes
  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.uTexture = texture;
      materialRef.current.uResolution.set(width, height);
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
      <morphingImageMaterial
        ref={materialRef}
        uTexture={texture}
        uTime={0}
        uBass={0}
        uMid={0}
        uTreble={0}
        uBeat={0}
        uEnergy={0}
        uResolution={[width, height]}
        uMorphIntensity={1.0}
        uWaveAmplitude={0.5}
        uTwistAmount={0.0}
        uBulgeAmount={0.0}
        uRippleFrequency={5.0}
        uColorMorph={0.3}
        uPixelation={0.0}
        uKaleidoscope={0.0}
        uMoodColor={moodColor}
        transparent
      />
    </Plane>
  );
}
