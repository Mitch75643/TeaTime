import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OtherCategoryEffectProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function OtherCategoryEffect({ isVisible, onComplete }: OtherCategoryEffectProps) {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Play the sound effect
      playOtherCategorySound();
      
      // Show particles after a short delay
      setTimeout(() => setShowParticles(true), 300);
      
      // Complete the animation
      setTimeout(() => {
        setShowParticles(false);
        onComplete();
      }, 1500);
    }
  }, [isVisible, onComplete]);

  const playOtherCategorySound = () => {
    try {
      // Create audio context for pencil scribble sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Soft pencil scribble sound (0.3s)
      const scribbleOscillator = audioContext.createOscillator();
      const scribbleGain = audioContext.createGain();
      
      scribbleOscillator.connect(scribbleGain);
      scribbleGain.connect(audioContext.destination);
      
      scribbleOscillator.type = 'sawtooth';
      scribbleOscillator.frequency.setValueAtTime(80, audioContext.currentTime);
      scribbleOscillator.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.3);
      
      scribbleGain.gain.setValueAtTime(0, audioContext.currentTime);
      scribbleGain.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.05);
      scribbleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      scribbleOscillator.start(audioContext.currentTime);
      scribbleOscillator.stop(audioContext.currentTime + 0.3);
      
      // Gentle chime sound (0.8s) - starts after scribble
      setTimeout(() => {
        const chimeOscillator = audioContext.createOscillator();
        const chimeGain = audioContext.createGain();
        
        chimeOscillator.connect(chimeGain);
        chimeGain.connect(audioContext.destination);
        
        chimeOscillator.type = 'sine';
        chimeOscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        
        chimeGain.gain.setValueAtTime(0, audioContext.currentTime);
        chimeGain.gain.linearRampToValueAtTime(0.04, audioContext.currentTime + 0.1);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
        
        chimeOscillator.start(audioContext.currentTime);
        chimeOscillator.stop(audioContext.currentTime + 0.8);
      }, 400);
      
    } catch (error) {
      console.log("Audio not supported in this browser");
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Main pencil and paper animation */}
          <motion.div
            className="relative"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Paper background */}
            <motion.div
              className="w-16 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-lg relative"
              initial={{ rotateY: -15 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Paper lines */}
              <div className="absolute inset-2 space-y-1">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-0.5 bg-gray-300 dark:bg-gray-600 rounded"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.2 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Pencil */}
            <motion.div
              className="absolute -right-2 top-2 transform rotate-45"
              initial={{ x: -10, y: 10, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{ x: 5, y: -5, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="text-2xl">📝</div>
            </motion.div>

            {/* Floating particles */}
            <AnimatePresence>
              {showParticles && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"
                      style={{
                        left: `${20 + Math.random() * 40}px`,
                        top: `${20 + Math.random() * 40}px`,
                      }}
                      initial={{ 
                        opacity: 0.6, 
                        scale: 0.5,
                        x: 0,
                        y: 0
                      }}
                      animate={{ 
                        opacity: 0, 
                        scale: 0,
                        x: (Math.random() - 0.5) * 60,
                        y: (Math.random() - 0.5) * 60
                      }}
                      transition={{ 
                        duration: 1, 
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Gentle text animation */}
          <motion.div
            className="absolute bottom-1/3 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Your thoughts shared
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing the Other category effect
export function useOtherCategoryEffect() {
  const [isVisible, setIsVisible] = useState(false);

  const triggerEffect = () => {
    setIsVisible(true);
  };

  const completeEffect = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    triggerEffect,
    completeEffect
  };
}