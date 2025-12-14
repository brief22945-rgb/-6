import { create } from 'zustand';
import { AppState, HandGesture, OrnamentData } from './types';
import * as THREE from 'three';

interface StoreState {
  appState: AppState;
  setAppState: (state: AppState) => void;
  
  // Gesture State
  gesture: HandGesture;
  setGesture: (gesture: HandGesture) => void;
  
  // Data
  ornaments: OrnamentData[];
  addPhotoOrnament: (url: string) => void;
  selectedPhotoId: string | null;
  setSelectedPhotoId: (id: string | null) => void;

  // Scene Rotation Control
  sceneRotation: [number, number, number];
  setSceneRotation: (rot: [number, number, number]) => void;
}

// Helper to generate random positions
const randomVector = (min: number, max: number): [number, number, number] => [
  Math.random() * (max - min) + min,
  Math.random() * (max - min) + min,
  Math.random() * (max - min) + min,
];

// REFINED TREE MATH: Organic Fir Shape
// Uses a power curve for the radius to create a swooping fir tree silhouette
// Adds volumetric depth (inner/outer branches)
const treeVector = (idx: number, total: number): { pos: [number, number, number], progress: number } => {
  const height = 11; // Slightly taller
  const yOffset = -5.0; // Shift down to center vertically
  
  // Progress from bottom (0) to top (1)
  const progress = idx / total;
  
  // Linear height distribution
  const y = progress * height + yOffset;
  
  // Radius calculation:
  // (1 - progress) creates a cone.
  // Math.pow(..., 0.8) makes it curve slightly (fatter bottom).
  const maxRadius = 4.2; // Wider base
  const coneRadius = maxRadius * Math.pow(1 - progress, 0.9);
  
  // Volumetric spread: allow items to be slightly inside the cone, not just on shell
  // Bias towards the shell (0.4 to 1.0 of the radius) for defined shape
  const rRandom = Math.sqrt(Math.random() * 0.6 + 0.4); 
  const r = coneRadius * rRandom;

  const angle = idx * 137.508 * (Math.PI / 180); // Golden angle
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  
  return { pos: [x, y, z], progress };
};

const INITIAL_COUNT = 650; // MORE DENSE -> Lush Christmas feel

// ATMOSPHERIC PALETTE: Warm, Traditional, Luxurious
const PALETTE = [
  '#FFD700', // Classic Gold (High weighting)
  '#FFD700', 
  '#C0C0C0', // Silver
  '#D90429', // Cardinal Red
  '#D90429',
  '#1B4332', // Deep Pine Green
  '#081c15', // Darker Green for depth
  '#FFFFFF', // Snow White lights
  '#F5F3FF', // Warm White
  '#ffb703', // Amber
];

const generateInitialOrnaments = (): OrnamentData[] => {
  return Array.from({ length: INITIAL_COUNT }).map((_, i) => {
    const typeProb = Math.random();
    let type: 'sphere' | 'box' | 'candy' = 'sphere';
    
    // Slight adjustments to distribution
    if (typeProb > 0.88) type = 'box';
    if (typeProb > 0.97) type = 'candy';

    const { pos, progress } = treeVector(i, INITIAL_COUNT);
    
    // Scale Logic: Larger at bottom, smaller at top
    // Base scale range: 0.15 to 0.45
    // Adjusted by (1 - progress)
    const heightFactor = (1 - progress) * 0.5 + 0.5; // 1.0 at bottom, 0.5 at top
    const baseScale = Math.random() * 0.3 + 0.15;
    const finalScale = baseScale * heightFactor;

    return {
      id: `ornament-${i}`,
      type,
      treePos: pos,
      scatterPos: randomVector(-9, 9), // Wider scatter
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      scale: finalScale,
    };
  });
};

export const useStore = create<StoreState>((set, get) => ({
  appState: AppState.TREE,
  setAppState: (state) => set({ appState: state }),

  gesture: {
    isDetected: false,
    isPalmOpen: false,
    isFist: false,
    isPinching: false,
    position: { x: 0.5, y: 0.5 },
    pinchDistance: 1,
    handSize: 0,
  },
  setGesture: (gesture) => {
    const currentState = get().appState;
    const ornaments = get().ornaments;
    
    if (gesture.isDetected) {
      // INTERACTION LOGIC

      // 1. PINCH (GRAB) -> Zoom Photo
      if (gesture.isPinching && currentState !== AppState.PHOTO_ZOOM) {
         const photos = ornaments.filter(o => o.type === 'photo');
         if (photos.length > 0) {
            const targetPhoto = photos[photos.length - 1];
            set({ 
              appState: AppState.PHOTO_ZOOM,
              selectedPhotoId: targetPhoto.id 
            });
         }
      }
      
      // 2. FIST -> Form Tree
      else if (gesture.isFist && currentState !== AppState.TREE && !gesture.isPinching) {
         set({ appState: AppState.TREE, selectedPhotoId: null });
      } 
      
      // 3. PALM OPEN -> Scatter
      else if (gesture.isPalmOpen && currentState === AppState.TREE && !gesture.isPinching) {
         set({ appState: AppState.SCATTER });
      }

      // Rotation Logic
      if (currentState !== AppState.PHOTO_ZOOM) {
         const targetY = (gesture.position.x - 0.5) * 2;
         const targetX = (gesture.position.y - 0.5) * 0.5;
         set({ sceneRotation: [targetX, targetY, 0] });
      }
    }

    set({ gesture });
  },

  ornaments: generateInitialOrnaments(),
  
  addPhotoOrnament: (url) => set((state) => {
    const newId = `photo-${Date.now()}`;
    
    // Position inside the tree body naturally
    const randomProgress = Math.random(); // 0 to 1
    const height = 11;
    const yOffset = -5.0;
    const y = randomProgress * height + yOffset;
    
    // Radius at this height
    const maxRadius = 4.2;
    const radiusAtY = maxRadius * Math.pow(1 - randomProgress, 0.9);
    
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radiusAtY * 0.9; // Slightly inside
    const z = Math.sin(angle) * radiusAtY * 0.9;

    const newOrnament: OrnamentData = {
      id: newId,
      type: 'photo',
      treePos: [x, y, z],
      scatterPos: randomVector(-6, 6),
      rotation: [0, 0, 0],
      color: '#ffffff',
      scale: 1.4, // Slightly larger for photos
      imageUrl: url
    };
    return { ornaments: [...state.ornaments, newOrnament] };
  }),

  selectedPhotoId: null,
  setSelectedPhotoId: (id) => set({ selectedPhotoId: id }),

  sceneRotation: [0, 0, 0],
  setSceneRotation: (rot) => set({ sceneRotation: rot }),
}));