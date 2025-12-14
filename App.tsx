import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import * as THREE from 'three';

const App: React.FC = () => {
  return (
    <div className="w-full h-screen relative bg-[#010204]">
      <Canvas 
        shadows
        dpr={[1, 2]} // 1. Support High DPI (Retina/4K)
        camera={{ position: [0, 0, 14], fov: 45, near: 0.1, far: 100 }} 
        gl={{ 
          antialias: true, // 2. Enable Anti-aliasing
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true
        }}
      >
        <Suspense fallback={null}>
           <Scene />
        </Suspense>
      </Canvas>
      <UI />
    </div>
  );
};

export default App;