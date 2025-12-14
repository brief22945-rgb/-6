import { Vector3 } from 'three';
import React from 'react';

export enum AppState {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  PHOTO_ZOOM = 'PHOTO_ZOOM',
}

export type OrnamentType = 'sphere' | 'box' | 'candy' | 'photo';

export interface OrnamentData {
  id: string;
  type: OrnamentType;
  treePos: [number, number, number];
  scatterPos: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale: number;
  imageUrl?: string;
}

export interface HandGesture {
  isDetected: boolean;
  isPalmOpen: boolean;
  isFist: boolean; 
  isPinching: boolean;
  position: { x: number; y: number }; // Normalized 0-1
  pinchDistance: number;
  handSize: number; // Apparent size of hand (0-1) for zoom control
}

// Augment JSX.IntrinsicElements to include React Three Fiber elements
type ThreeElement = any;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ThreeElement;
      mesh: ThreeElement;
      sphereGeometry: ThreeElement;
      boxGeometry: ThreeElement;
      torusGeometry: ThreeElement;
      meshStandardMaterial: ThreeElement;
      meshPhysicalMaterial: ThreeElement;
      cylinderGeometry: ThreeElement;
      planeGeometry: ThreeElement;
      meshBasicMaterial: ThreeElement;
      ambientLight: ThreeElement;
      pointLight: ThreeElement;
      spotLight: ThreeElement;
      dodecahedronGeometry: ThreeElement;
      icosahedronGeometry: ThreeElement; // Added stable geometry
      octahedronGeometry: ThreeElement;
      extrudeGeometry: ThreeElement;
      color: ThreeElement;
      primitive: ThreeElement;
      fogExp2: ThreeElement;
    }
  }
}

// Double augmentation for strict module environments
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: ThreeElement;
      mesh: ThreeElement;
      sphereGeometry: ThreeElement;
      boxGeometry: ThreeElement;
      torusGeometry: ThreeElement;
      meshStandardMaterial: ThreeElement;
      meshPhysicalMaterial: ThreeElement;
      cylinderGeometry: ThreeElement;
      planeGeometry: ThreeElement;
      meshBasicMaterial: ThreeElement;
      ambientLight: ThreeElement;
      pointLight: ThreeElement;
      spotLight: ThreeElement;
      dodecahedronGeometry: ThreeElement;
      icosahedronGeometry: ThreeElement;
      octahedronGeometry: ThreeElement;
      extrudeGeometry: ThreeElement;
      color: ThreeElement;
      primitive: ThreeElement;
      fogExp2: ThreeElement;
    }
  }
}