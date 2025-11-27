import React, { useEffect, useRef, useState } from 'react';
import { GestureType } from '../types';

interface GestureOverlayProps {
  onGesture: (type: GestureType) => void;
}

const GestureOverlay: React.FC<GestureOverlayProps> = ({ onGesture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feedbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [lastGesture, setLastGesture] = useState<GestureType>('NONE');
  const [permissionError, setPermissionError] = useState(false);
  const [motionIntensity, setMotionIntensity] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastImageData: ImageData | null = null;
    let cooldown = 0;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: 'user' } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
        }
      } catch (err) {
        console.error("Camera permission denied:", err);
        setPermissionError(true);
      }
    };

    const detectMotion = () => {
      if (!videoRef.current || !canvasRef.current || !feedbackCanvasRef.current) {
        animationFrameId = requestAnimationFrame(detectMotion);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const feedbackCanvas = feedbackCanvasRef.current;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const feedbackCtx = feedbackCanvas.getContext('2d');

      if (!ctx || !feedbackCtx || video.readyState !== 4) {
        animationFrameId = requestAnimationFrame(detectMotion);
        return;
      }

      if (cooldown > 0) cooldown--;

      // 1. Draw video to processing canvas (hidden)
      const width = canvas.width;
      const height = canvas.height;
      ctx.drawImage(video, 0, 0, width, height);
      
      // 2. Prepare feedback canvas (visible)
      feedbackCtx.clearRect(0, 0, width, height);
      // We want the feedback to be mirrored like the video CSS, 
      // but since the canvas is overlaid on a mirrored video, we draw normally.
      
      const currentImageData = ctx.getImageData(0, 0, width, height);

      if (lastImageData) {
        let leftMotion = 0;
        let rightMotion = 0;
        const midX = width / 2;
        
        // Settings for sensitivity
        const threshold = 20; // Color difference threshold (Lower = more sensitive to light changes)
        const skip = 4; // Check every 4th pixel for performance
        
        // Visualization: Set green color for motion
        feedbackCtx.fillStyle = 'rgba(0, 255, 128, 0.6)';

        for (let i = 0; i < currentImageData.data.length; i += 4 * skip) { 
          const rDiff = Math.abs(currentImageData.data[i] - lastImageData.data[i]);
          const gDiff = Math.abs(currentImageData.data[i + 1] - lastImageData.data[i + 1]);
          const bDiff = Math.abs(currentImageData.data[i + 2] - lastImageData.data[i + 2]);

          if (rDiff + gDiff + bDiff > threshold * 3) {
            const pixelIndex = i / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);

            // Draw motion pixel on feedback canvas
            // Optimization: Draw larger rectangles instead of single pixels
            feedbackCtx.fillRect(x, y, 2, 2); 

            // Logic for mirrored video:
            // The raw video image has user's RIGHT hand on the RIGHT side of the image (x > midX).
            // The CSS mirrors the video, so that RIGHT side appears on the LEFT of the screen.
            // If we want "Wave on Screen Left" -> That corresponds to x > midX in raw image.
            
            // However, usually "Rotate Left" means "Wave Left Hand".
            // Left Hand -> Appears on Left side of Screen (if mirrored).
            // Screen Left -> Raw Image Right (because of mirror).
            // So:
            // Screen Left (User's Left Hand) = Raw x > midX
            // Screen Right (User's Right Hand) = Raw x < midX
            
            if (x < midX) {
               rightMotion++; // Raw Left = Screen Right
            } else {
               leftMotion++;  // Raw Right = Screen Left
            }
          }
        }

        const totalMotion = leftMotion + rightMotion;
        setMotionIntensity(totalMotion);

        // Sensitivity Thresholds
        const triggerThreshold = 80; // How many pixels need to move (Lowered from ~200)
        
        if (cooldown === 0) {
          if (leftMotion > triggerThreshold && leftMotion > rightMotion * 1.5) {
             // Waved on Screen Left (User's Left)
             handleGestureTrigger('ROTATE_LEFT');
             cooldown = 45; // ~1.5 seconds cooldown
          } else if (rightMotion > triggerThreshold && rightMotion > leftMotion * 1.5) {
             // Waved on Screen Right (User's Right)
             handleGestureTrigger('ROTATE_RIGHT');
             cooldown = 45;
          }
        }
      }

      lastImageData = currentImageData;
      animationFrameId = requestAnimationFrame(detectMotion);
    };

    const handleGestureTrigger = (type: GestureType) => {
      setLastGesture(type);
      onGesture(type);
      setTimeout(() => setLastGesture('NONE'), 1500);
    };

    startCamera();
    detectMotion();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [onGesture]);

  if (permissionError) return null;

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800/20 shadow-2xl bg-black w-40 h-32 backdrop-blur-md">
        {/* Raw Video Feed (Mirrored via CSS) */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover opacity-80 scale-x-[-1]" 
        />
        
        {/* Processing Canvas (Hidden) */}
        <canvas 
          ref={canvasRef} 
          width="320" 
          height="240" 
          className="hidden"
        />

        {/* Feedback Overlay Canvas (Mirrored to match video) */}
        <canvas 
          ref={feedbackCanvasRef}
          width="320"
          height="240"
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60"
        />
        
        {/* HUD Overlay */}
        <div className="absolute inset-0 border-[3px] border-white/10 rounded-2xl pointer-events-none"></div>
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-[10px] font-mono text-white/90 uppercase tracking-widest shadow-black drop-shadow-md">
            Gesture AI {motionIntensity > 50 && '• Active'}
          </span>
        </div>

        {/* Dynamic Visual Feedback */}
        {lastGesture !== 'NONE' && (
           <div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 backdrop-blur-[2px] animate-fade-in z-20">
             <div className="text-center">
                <div className="text-3xl mb-1 text-white drop-shadow-lg">
                  {lastGesture === 'ROTATE_LEFT' ? '↺' : '↻'}
                </div>
                <div className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
                  {lastGesture === 'ROTATE_LEFT' ? 'Left' : 'Right'}
                </div>
             </div>
           </div>
        )}
      </div>
      
      <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-white/50 text-[10px] text-slate-500 font-medium flex items-center gap-2">
        <span>👋 Wave Hand L/R</span>
        {/* Simple Motion Meter */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${Math.min(motionIntensity / 5, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GestureOverlay;