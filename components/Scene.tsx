import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore } from '../store';
import { Ornament } from './Ornament';
import { AppState } from '../types';

// Custom Implementations for Missing Drei Components

const Float: React.FC<any> = ({ children, speed = 1, rotationIntensity = 1, floatIntensity = 1, floatingRange = [-0.1, 0.1] }) => {
  const ref = useRef<THREE.Group>(null);
  const offset = useRef(Math.random() * 10000);
  
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset.current;
    ref.current.rotation.x = Math.cos(t / 4) * rotationIntensity / 8;
    ref.current.rotation.y = Math.sin(t / 4) * rotationIntensity / 8;
    ref.current.rotation.z = Math.sin(t / 4) * rotationIntensity / 20;
    
    // Simple harmonic motion for Y floating
    ref.current.position.y = Math.sin(t / 4) * floatIntensity / 10;
  });

  return (
    <group ref={ref}>
      {children}
    </group>
  );
};

const Stars: React.FC<any> = ({ radius = 100, count = 5000 }) => {
   const points = useMemo(() => {
     const p = new Float32Array(count * 3);
     for(let i=0; i<count*3; i+=3) {
       const r = radius * Math.cbrt(Math.random());
       const theta = Math.random() * Math.PI * 2;
       const phi = Math.acos(2 * Math.random() - 1);
       p[i] = r * Math.sin(phi) * Math.cos(theta);
       p[i+1] = r * Math.sin(phi) * Math.sin(theta);
       p[i+2] = r * Math.cos(phi);
     }
     return p;
   }, [count, radius]);

   return (
     <points>
       <bufferGeometry>
         <bufferAttribute attach="attributes-position" count={count} array={points} itemSize={3} />
       </bufferGeometry>
       <pointsMaterial size={0.5} color="white" transparent opacity={0.8} sizeAttenuation depthWrite={false} />
     </points>
   );
};

const Sparkles: React.FC<any> = ({ count = 100, scale = 10, size = 1, color = "white", opacity = 1 }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) {
        // Handle scale as number or vector-like (simplified to number here based on usage)
        const s = typeof scale === 'number' ? scale : 10;
        p[i] = (Math.random() - 0.5) * s * 2;
    }
    return p;
  }, [count, scale]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uSize: { value: size },
    uOpacity: { value: opacity }
  }), [color, size, opacity]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  const vertexShader = `
    uniform float uTime;
    uniform float uSize;
    void main() {
        vec3 pos = position;
        pos.y += sin(uTime * 0.5 + position.x) * 0.2;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = uSize * (20.0 / -mvPosition.z);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    void main() {
        if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
        float alpha = uOpacity * (0.5 + 0.5 * sin(uTime * 3.0 + gl_FragCoord.x));
        gl_FragColor = vec4(uColor, alpha);
    }
  `;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={points} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial 
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Exquisite 5-Pointed Star Component
const StarTopper = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate the Star Shape
  const { shape, extrudeSettings } = useMemo(() => {
    const s = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.55; 
    const innerRadius = 0.25; 
    
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();

    const settings = {
      steps: 1,
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 8, 
    };

    return { shape: s, extrudeSettings: settings };
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group position={[0, 6.2, 0]}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshPhysicalMaterial 
            color="#FFD700" 
            emissive="#FFAB00"
            emissiveIntensity={0.5}
            metalness={1.0} 
            roughness={0.05}
            transmission={0.2}
            thickness={2}
            clearcoat={1.0}
            envMapIntensity={3.0}
          />
        </mesh>
        
        <pointLight intensity={3} color="#FFD700" distance={8} decay={2} />
        <Sparkles count={30} scale={2.5} size={4} speed={0.4} opacity={0.6} color="#FFE0B2" />
    </group>
  );
};

export const Scene: React.FC = () => {
  const ornaments = useStore((s) => s.ornaments);
  const sceneRotation = useStore((s) => s.sceneRotation);
  const appState = useStore((s) => s.appState);
  const gesture = useStore((s) => s.gesture);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // 1. Scene Rotation
    if (groupRef.current) {
      const targetPitch = sceneRotation[0] * Math.PI * 0.35; 
      const targetYaw = sceneRotation[1] * Math.PI * 0.35;   

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetPitch, delta * 2.5);

      if (appState === AppState.SCATTER) {
         groupRef.current.rotation.y -= delta * 0.15;
      } else {
         if (gesture.isDetected) {
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetYaw, delta * 2.5);
         } else {
            groupRef.current.rotation.y += delta * 0.08;
         }
      }
    }

    // 2. Camera Zoom
    const defaultZ = 14;
    let targetZ = defaultZ;

    if (gesture.isDetected && appState !== AppState.PHOTO_ZOOM) {
        const size = THREE.MathUtils.clamp(gesture.handSize, 0.05, 0.35);
        targetZ = THREE.MathUtils.mapLinear(size, 0.05, 0.35, 10, 24);
    } else if (appState === AppState.PHOTO_ZOOM) {
        targetZ = 14; 
    }
    
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 1.5);
  });

  return (
    <>
      <color attach="background" args={['#010204']} />
      <fogExp2 attach="fog" args={['#010204', 0.03]} />

      <ambientLight intensity={0.4} />

      <group>
        <spotLight 
            position={[10, 12, 10]} 
            angle={0.4} 
            penumbra={0.5} 
            intensity={180} 
            color="#ffeebb" 
            castShadow 
            shadow-bias={-0.0001}
            shadow-mapSize={[2048, 2048]}
        />
        <spotLight position={[-10, 8, -5]} angle={0.5} penumbra={1} intensity={100} color="#88ccff" />
        <pointLight position={[0, -5, 2]} intensity={40} color="#ffaa00" decay={2} />
      </group>

      <EffectComposer disableNormalPass multisampling={0}>
        <SMAA />
        <Bloom 
            luminanceThreshold={1.1} 
            mipmapBlur 
            intensity={0.35} 
            radius={0.5} 
            levels={9}
        />
        <ChromaticAberration offset={[new THREE.Vector2(0.0005, 0.0005)]} radialModulation={false} modulationOffset={0} />
        <Noise opacity={0.015} /> 
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>

      {/* Background Stars */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      
      {/* Floating Magic Dust */}
      <Sparkles 
        count={appState === AppState.TREE ? 200 : 800} 
        scale={appState === AppState.TREE ? 14 : 25} 
        size={2} 
        speed={0.4}
        opacity={0.5} 
        color="#E0F7FA" 
      />

      <group ref={groupRef}>
         <Float 
            speed={appState === AppState.TREE ? 1 : 2} 
            rotationIntensity={appState === AppState.TREE ? 0.2 : 0.8} 
            floatIntensity={0.5}
            floatingRange={[-0.1, 0.1]}
         >
          {ornaments.map((ornament) => (
            <Ornament key={ornament.id} data={ornament} />
          ))}
          
          <group scale={appState === AppState.TREE ? 1 : 0.8} visible={appState !== AppState.PHOTO_ZOOM}>
             <StarTopper />
          </group>
         </Float>
      </group>
    </>
  );
};