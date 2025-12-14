import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, OrnamentData } from '../types';
import { useStore } from '../store';

// Custom Billboard to replace missing drei export
const Billboard: React.FC<{ children: React.ReactNode; [key: string]: any }> = ({ children }) => {
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (group.current) {
      group.current.quaternion.copy(camera.quaternion);
    }
  });
  return <group ref={group}>{children}</group>;
};

const PhotoPlane: React.FC<{ data: OrnamentData }> = ({ data }) => {
  const texture = useLoader(THREE.TextureLoader, data.imageUrl!);
  const appState = useStore((s) => s.appState);
  
  return (
    <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          if (appState === AppState.SCATTER) {
             useStore.getState().setAppState(AppState.PHOTO_ZOOM);
             useStore.getState().setSelectedPhotoId(data.id);
          } else if (appState === AppState.PHOTO_ZOOM) {
             useStore.getState().setAppState(AppState.SCATTER);
             useStore.getState().setSelectedPhotoId(null);
          }
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        {/* Premium Gold Frame */}
        <mesh position={[0,0,-0.02]} castShadow>
           <boxGeometry args={[1.15, 1.15, 0.05]} />
           <meshPhysicalMaterial 
             color="#FFD700" 
             roughness={0.15} 
             metalness={1} 
             clearcoat={1}
           />
        </mesh>
        {/* Backing */}
        <mesh position={[0,0,-0.025]}>
           <planeGeometry args={[1.1, 1.1]} />
           <meshBasicMaterial color="#000" />
        </mesh>
        {/* The Photo */}
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </Billboard>
  );
};

interface Props {
  data: OrnamentData;
}

export const Ornament: React.FC<Props> = ({ data }) => {
  const meshRef = useRef<THREE.Group>(null);
  const appState = useStore((s) => s.appState);
  const selectedPhotoId = useStore((s) => s.selectedPhotoId);

  // Vectors for reuse
  const targetPos = useRef(new THREE.Vector3());
  const currentScale = useRef(data.scale);
  const randomPhase = useRef(Math.random() * 100);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Positioning Logic
    if (appState === AppState.TREE) {
      targetPos.current.set(...data.treePos);
      currentScale.current = THREE.MathUtils.lerp(currentScale.current, data.scale, delta * 2);
    } 
    else if (appState === AppState.SCATTER) {
      targetPos.current.set(...data.scatterPos);
      targetPos.current.y += Math.sin(state.clock.elapsedTime + data.treePos[0]) * 0.005;
      currentScale.current = THREE.MathUtils.lerp(currentScale.current, data.scale, delta * 2);
    }
    else if (appState === AppState.PHOTO_ZOOM) {
       if (data.id === selectedPhotoId) {
         targetPos.current.set(0, 0, 9); // Bring very close
         currentScale.current = THREE.MathUtils.lerp(currentScale.current, 4.0, delta * 3);
       } else {
         targetPos.current.set(...data.scatterPos);
         targetPos.current.multiplyScalar(2.5); 
         currentScale.current = THREE.MathUtils.lerp(currentScale.current, 0, delta * 5); 
       }
    }

    meshRef.current.position.lerp(targetPos.current, delta * 3);
    meshRef.current.scale.setScalar(currentScale.current);

    if (data.type !== 'photo') {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      
      // Twinkle rotation
      if (appState === AppState.TREE) {
         meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2 + randomPhase.current) * 0.1;
      }
    }
  });

  // LUXURY MATERIALS
  // 1. High Gloss Glass/Crystal Sphere
  const sphereMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: data.color,
    roughness: 0.05,        // Extremely smooth
    metalness: 0.3,         // Slight metallic for reflection
    transmission: 0.6,      // Semi-transparent glass
    thickness: 1.5,         // Refraction thickness
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    envMapIntensity: 2.5,   // Strong environment reflections
    ior: 1.5,               // Glass index of refraction
    attenuationColor: new THREE.Color(data.color), // Inner color
    attenuationDistance: 0.5,
  }), [data.color]);

  // 2. Matte Metallic Box (Gift Box)
  const boxMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: data.color,
    roughness: 0.4, // Satin finish
    metalness: 0.6,
    clearcoat: 0.5,
    envMapIntensity: 1.5,
  }), [data.color]);

  const ribbonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#F5BD02", // Gold
    metalness: 1,
    roughness: 0.2,
    envMapIntensity: 2
  }), []);

  // 3. Glossy Candy
  const candyRed = useMemo(() => new THREE.MeshPhysicalMaterial({ 
    color: "#D60000", 
    roughness: 0.1, 
    metalness: 0.1, 
    clearcoat: 1.0,
    envMapIntensity: 2
  }), []);
  
  const candyWhite = useMemo(() => new THREE.MeshPhysicalMaterial({ 
    color: "#FFFFFF", 
    roughness: 0.2, 
    metalness: 0.0, 
    clearcoat: 0.5 
  }), []);

  return (
    <group ref={meshRef} position={data.treePos} castShadow receiveShadow>
      {data.type === 'sphere' && (
        <mesh material={sphereMaterial} castShadow>
          <sphereGeometry args={[0.5, 64, 64]} />
        </mesh>
      )}
      {data.type === 'box' && (
        <group>
           <mesh material={boxMaterial} castShadow>
             <boxGeometry args={[0.6, 0.6, 0.6]} />
           </mesh>
           <mesh position={[0, 0.301, 0]} material={ribbonMaterial}>
             <boxGeometry args={[0.12, 0.02, 0.62]} />
           </mesh>
           <mesh position={[0, 0.301, 0]} rotation={[0,Math.PI/2,0]} material={ribbonMaterial}>
             <boxGeometry args={[0.12, 0.02, 0.62]} />
           </mesh>
        </group>
      )}
      {data.type === 'candy' && (
        <group position={[0,0.2,0]}>
           <mesh position={[0,0,0]} castShadow>
             <torusGeometry args={[0.2, 0.06, 16, 32, Math.PI]} />
             <primitive object={candyRed} attach="material" />
           </mesh>
           <mesh position={[0.2, -0.4, 0]} castShadow>
             <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
             <primitive object={candyWhite} attach="material" />
           </mesh>
        </group>
      )}
      {data.type === 'photo' && data.imageUrl && (
        <PhotoPlane data={data} />
      )}
    </group>
  );
};
