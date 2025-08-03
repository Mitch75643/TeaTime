import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TestTube, FlaskConical, Beaker } from "lucide-react";

interface ChemistryAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

// Chemistry-themed sound effect
const playChemistrySounds = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a gentle bubbling/fizzing sound
    const bubbleOsc1 = audioContext.createOscillator();
    const bubbleOsc2 = audioContext.createOscillator();
    const bubbleGain = audioContext.createGain();
    const bubbleFilter = audioContext.createBiquadFilter();
    
    // Create filtered noise for fizzing effect
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.1;
    }
    
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = audioContext.createGain();
    const noiseFilter = audioContext.createBiquadFilter();
    
    // Connect bubbling oscillators
    bubbleOsc1.connect(bubbleFilter);
    bubbleOsc2.connect(bubbleFilter);
    bubbleFilter.connect(bubbleGain);
    bubbleGain.connect(audioContext.destination);
    
    // Connect fizzing noise
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    // Configure bubbling sound
    bubbleOsc1.type = "sine";
    bubbleOsc2.type = "sine";
    bubbleFilter.type = "lowpass";
    bubbleFilter.frequency.setValueAtTime(800, audioContext.currentTime);
    
    // Bubbling frequencies - create gentle bubble pops
    bubbleOsc1.frequency.setValueAtTime(250, audioContext.currentTime);
    bubbleOsc1.frequency.setValueAtTime(300, audioContext.currentTime + 0.1);
    bubbleOsc1.frequency.setValueAtTime(280, audioContext.currentTime + 0.2);
    bubbleOsc1.frequency.setValueAtTime(320, audioContext.currentTime + 0.4);
    
    bubbleOsc2.frequency.setValueAtTime(180, audioContext.currentTime);
    bubbleOsc2.frequency.setValueAtTime(220, audioContext.currentTime + 0.15);
    bubbleOsc2.frequency.setValueAtTime(200, audioContext.currentTime + 0.3);
    
    // Bubble gain envelope
    bubbleGain.gain.setValueAtTime(0, audioContext.currentTime);
    bubbleGain.gain.linearRampToValueAtTime(0.06, audioContext.currentTime + 0.05);
    bubbleGain.gain.setValueAtTime(0.06, audioContext.currentTime + 0.3);
    bubbleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    // Configure fizzing noise
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(1200, audioContext.currentTime);
    noiseGain.gain.setValueAtTime(0, audioContext.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    // Start sounds
    bubbleOsc1.start(audioContext.currentTime);
    bubbleOsc1.stop(audioContext.currentTime + 0.6);
    bubbleOsc2.start(audioContext.currentTime);
    bubbleOsc2.stop(audioContext.currentTime + 0.6);
    noiseSource.start(audioContext.currentTime);
    noiseSource.stop(audioContext.currentTime + 0.3);
    
  } catch (error) {
    console.log("Audio playback not supported");
  }
};

export function ChemistryAnimation({ isVisible, onComplete }: ChemistryAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      playChemistrySounds();
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {showAnimation && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          {/* Main Beaker Animation */}
          <motion.div
            className="relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "backOut" }}
          >
            {/* Beaker Container */}
            <motion.div
              className="text-6xl relative z-10"
              animate={{ 
                rotate: [0, -5, 5, -3, 3, 0],
              }}
              transition={{ 
                duration: 1.5, 
                ease: "easeInOut",
                times: [0, 0.2, 0.4, 0.6, 0.8, 1]
              }}
            >
              <FlaskConical className="h-16 w-16 text-cyan-600" />
            </motion.div>
            
            {/* Bubbling Liquid Effect Inside Beaker */}
            <motion.div
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-gradient-to-t from-cyan-400 to-blue-300 rounded-b-full"
              animate={{
                height: [24, 32, 28, 35, 30],
                backgroundColor: [
                  "rgb(34, 211, 238)", // cyan-400
                  "rgb(59, 130, 246)", // blue-500  
                  "rgb(168, 85, 247)", // purple-500
                  "rgb(236, 72, 153)", // pink-500
                  "rgb(34, 211, 238)"  // back to cyan
                ]
              }}
              transition={{ 
                duration: 1.2, 
                ease: "easeInOut",
                repeat: 1
              }}
            />
            
            {/* Bubbles floating up from beaker */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-cyan-300 rounded-full opacity-70"
                initial={{ 
                  x: Math.random() * 40 - 20,
                  y: 10,
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  x: Math.random() * 60 - 30,
                  y: -80 - Math.random() * 40,
                  scale: [0, 1, 0.8, 0],
                  opacity: [0, 0.8, 0.6, 0]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
            
            {/* Test tubes on sides */}
            <motion.div
              className="absolute -left-12 top-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <TestTube className="h-8 w-8 text-purple-500" />
            </motion.div>
            
            <motion.div
              className="absolute -right-12 top-2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Beaker className="h-8 w-8 text-pink-500" />
            </motion.div>
          </motion.div>
          
          {/* Explosion/Fizzing Effect */}
          <motion.div
            className="absolute"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 2] }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                initial={{ 
                  x: 0,
                  y: 0,
                  scale: 0
                }}
                animate={{
                  x: Math.cos(i * 45 * Math.PI / 180) * 60,
                  y: Math.sin(i * 45 * Math.PI / 180) * 60,
                  scale: [0, 1, 0],
                  backgroundColor: [
                    "rgb(250, 204, 21)", // yellow-400
                    "rgb(248, 113, 113)", // red-400
                    "rgb(34, 211, 238)", // cyan-400
                    "rgb(250, 204, 21)"
                  ]
                }}
                transition={{
                  duration: 1,
                  delay: 0.6 + i * 0.05,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
          
          {/* Success Message */}
          <motion.div
            className="absolute bottom-20 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg"
            initial={{ scale: 0, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: -20, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "backOut" }}
          >
            <span className="text-sm font-medium">🧪 Experiment Launched!</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing chemistry animations
export function useChemistryAnimation() {
  const [isVisible, setIsVisible] = useState(false);

  const triggerAnimation = () => {
    setIsVisible(true);
  };

  const completeAnimation = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    triggerAnimation,
    completeAnimation
  };
}