import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { initializeHandTracking } from '../services/gestureService';
import { AppState } from '../types';

export const UI: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const addPhotoOrnament = useStore((s) => s.addPhotoOrnament);
  const appState = useStore((s) => s.appState);
  const gesture = useStore((s) => s.gesture);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    const startVideo = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', () => {
               initializeHandTracking(videoRef.current!);
            });
          }
        } catch (err) {
          console.error("Camera access denied:", err);
        }
      }
    };
    startVideo();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      addPhotoOrnament(url);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Magic Christmas Tree',
      text: 'Check out this 3D interactive Christmas Tree controlled by hand gestures!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (err) {
      console.log('Share canceled');
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 overflow-hidden">
      
      {/* Top Bar: Title & Status */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-4">
          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
             <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-yellow-200 font-['Cinzel']">
              Holiday Dreams
            </h1>
            <div className="flex items-center gap-2 mt-2">
               <div className={`w-2 h-2 rounded-full ${gesture.isDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
               <span className="text-blue-100/80 text-xs tracking-widest font-light uppercase">
                  {gesture.isDetected ? "System Online" : "Waiting for Hand"}
               </span>
            </div>
          </div>

          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="pointer-events-auto self-start flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-white/80 transition-all text-xs uppercase tracking-wider font-semibold group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {showCopied ? "Link Copied!" : "Share Magic"}
          </button>
        </div>

        {/* Minimalist Camera HUD */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)] opacity-70 hover:opacity-100 transition-opacity">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          {/* Subtle Tracking Dot */}
          {gesture.isDetected && (
             <div 
               className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(255,215,0,0.8)]"
               style={{ 
                 left: `${gesture.position.x * 100}%`, 
                 top: `${gesture.position.y * 100}%`,
                 transform: 'translate(-50%, -50%)'
               }}
             />
          )}
        </div>
      </div>

      {/* Center Feedback (Dynamic) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
         {appState === AppState.PHOTO_ZOOM && (
            <div className="text-white/80 text-lg font-['Cinzel'] tracking-[0.2em] animate-fade-in-up">
               MEMORY RECALLED
            </div>
         )}
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-between items-end w-full">
        
        {/* Gesture Guide - Glass Cards */}
        <div className="flex gap-4">
           <div className={`p-4 rounded-xl border transition-all duration-300 ${gesture.isFist ? 'bg-white/20 border-yellow-400' : 'bg-black/30 border-white/5'}`}>
              <div className="text-2xl mb-1">✊</div>
              <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">Tree</div>
           </div>
           <div className={`p-4 rounded-xl border transition-all duration-300 ${gesture.isPalmOpen ? 'bg-white/20 border-blue-400' : 'bg-black/30 border-white/5'}`}>
              <div className="text-2xl mb-1">🖐️</div>
              <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">Scatter</div>
           </div>
           <div className={`p-4 rounded-xl border transition-all duration-300 ${gesture.isPinching ? 'bg-white/20 border-red-400' : 'bg-black/30 border-white/5'}`}>
              <div className="text-2xl mb-1">👌</div>
              <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">Grab Photo</div>
           </div>
        </div>

        {/* Action Button */}
        <div className="pointer-events-auto">
          <label className="cursor-pointer flex items-center gap-4 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-500 backdrop-blur-md text-white pl-4 pr-6 py-3 rounded-full border border-white/20 shadow-[0_0_30px_rgba(0,100,255,0.3)] transition-all transform hover:scale-105 active:scale-95 group">
             <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-blue-200 uppercase tracking-wider font-bold">Upload</span>
               <span className="font-['Cinzel'] font-bold text-lg leading-none">Memory</span>
             </div>
             <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    </div>
  );
};