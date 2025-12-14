import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { useStore } from "../store";

let handLandmarker: HandLandmarker | undefined;
let animationId: number;

export const initializeHandTracking = async (video: HTMLVideoElement) => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });

  startDetectionLoop(video);
};

const startDetectionLoop = (video: HTMLVideoElement) => {
  let lastVideoTime = -1;

  const renderLoop = () => {
    if (handLandmarker && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const result = handLandmarker.detectForVideo(video, performance.now());

      if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0];
        
        // 1. Calculate Palm Open State / Fist State
        // Check distance of fingertips to wrist vs PIP joints to wrist
        const wrist = landmarks[0];
        const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
        const pips = [6, 10, 14, 18];
        
        let openFingers = 0;
        for (let i = 0; i < 4; i++) {
           // Calculate euclidean distance to wrist
           const distTip = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y);
           const distPip = Math.hypot(landmarks[pips[i]].x - wrist.x, landmarks[pips[i]].y - wrist.y);
           // If tip is significantly further than PIP, it's open
           if (distTip > distPip * 1.1) openFingers++;
        }

        const isPalmOpen = openFingers >= 4;
        const isFist = openFingers <= 1; // 0 or 1 finger (allows for thumb variation)

        // 2. Pinch Detection (Thumb tip 4 and Index tip 8)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const isPinching = pinchDist < 0.05; // Threshold

        // 3. Hand Centroid
        let sumX = 0, sumY = 0;
        landmarks.forEach(l => { sumX += l.x; sumY += l.y; });
        const centerX = sumX / landmarks.length;
        const centerY = sumY / landmarks.length;

        // 4. Hand Size (Apparent Scale for Depth/Zoom)
        // Distance between Wrist (0) and Middle Finger MCP (9) is a stable measure of hand size
        const middleMCP = landmarks[9];
        const handSize = Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y);

        useStore.getState().setGesture({
          isDetected: true,
          isPalmOpen,
          isFist,
          isPinching,
          position: { x: 1 - centerX, y: centerY }, // Mirror X
          pinchDistance: pinchDist,
          handSize: handSize
        });

      } else {
        useStore.getState().setGesture({
          isDetected: false,
          isPalmOpen: false,
          isFist: false,
          isPinching: false,
          position: { x: 0.5, y: 0.5 },
          pinchDistance: 1,
          handSize: 0
        });
      }
    }
    animationId = requestAnimationFrame(renderLoop);
  };
  
  renderLoop();
};

export const stopHandTracking = () => {
  if (animationId) cancelAnimationFrame(animationId);
};