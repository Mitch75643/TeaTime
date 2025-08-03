import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Zap, Flame, MessageSquare, FlaskConical } from "lucide-react";

interface CelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
  type: "celebrity-tea" | "story-time" | "hot-topics" | "daily-debate" | "tea-experiments";
}

// Audio helper function
const playSound = (soundType: string) => {
  try {
    // Create simple audio using Web Audio API for sound effects
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    switch (soundType) {
      case "camera-shutter":
        // Quick click sound
        const clickOsc = audioContext.createOscillator();
        const clickGain = audioContext.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(audioContext.destination);
        clickOsc.frequency.setValueAtTime(800, audioContext.currentTime);
        clickGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        clickOsc.start(audioContext.currentTime);
        clickOsc.stop(audioContext.currentTime + 0.1);
        break;
        
      case "whoosh":
        // Swoosh sound
        const whooshOsc = audioContext.createOscillator();
        const whooshGain = audioContext.createGain();
        whooshOsc.connect(whooshGain);
        whooshGain.connect(audioContext.destination);
        whooshOsc.frequency.setValueAtTime(400, audioContext.currentTime);
        whooshOsc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        whooshGain.gain.setValueAtTime(0.2, audioContext.currentTime);
        whooshGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        whooshOsc.start(audioContext.currentTime);
        whooshOsc.stop(audioContext.currentTime + 0.3);
        break;
        
      case "sizzle":
        // Sizzling fire sound
        const sizzleOsc = audioContext.createOscillator();
        const sizzleGain = audioContext.createGain();
        sizzleOsc.connect(sizzleGain);
        sizzleGain.connect(audioContext.destination);
        sizzleOsc.type = "sawtooth";
        sizzleOsc.frequency.setValueAtTime(200, audioContext.currentTime);
        sizzleGain.gain.setValueAtTime(0.15, audioContext.currentTime);
        sizzleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        sizzleOsc.start(audioContext.currentTime);
        sizzleOsc.stop(audioContext.currentTime + 0.4);
        break;
        
      case "clash":
        // Quick ping/clash sound
        const clashOsc = audioContext.createOscillator();
        const clashGain = audioContext.createGain();
        clashOsc.connect(clashGain);
        clashGain.connect(audioContext.destination);
        clashOsc.frequency.setValueAtTime(1200, audioContext.currentTime);
        clashOsc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        clashGain.gain.setValueAtTime(0.25, audioContext.currentTime);
        clashGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        clashOsc.start(audioContext.currentTime);
        clashOsc.stop(audioContext.currentTime + 0.2);
        break;
        
      case "fizz":
        // Bubbly fizzing sound
        const fizzOsc = audioContext.createOscillator();
        const fizzGain = audioContext.createGain();
        fizzOsc.connect(fizzGain);
        fizzGain.connect(audioContext.destination);
        fizzOsc.type = "square";
        fizzOsc.frequency.setValueAtTime(300, audioContext.currentTime);
        fizzGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        fizzGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        fizzOsc.start(audioContext.currentTime);
        fizzOsc.stop(audioContext.currentTime + 0.5);
        break;
    }
  } catch (error) {
    // Fallback - silent if audio context fails
    console.log("Audio playback not supported");
  }
};

export function CelebrationAnimation({ isVisible, onComplete, type }: CelebrationProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      
      // Play sound effect
      switch (type) {
        case "celebrity-tea":
          playSound("camera-shutter");
          break;
        case "story-time":
          playSound("whoosh");
          break;
        case "hot-topics":
          playSound("sizzle");
          break;
        case "daily-debate":
          playSound("clash");
          break;
        case "tea-experiments":
          playSound("fizz");
          break;
      }
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, type, onComplete]);

  const renderCelebrityTea = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Paparazzi Flashes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-full h-full bg-white"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.8, 0, 0.6, 0, 0.4, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Camera Icon */}
      <motion.div
        className="absolute bg-pink-500 text-white p-4 rounded-full"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotate: [0, -10, 10, 0]
        }}
        transition={{ duration: 1, ease: "backOut" }}
      >
        <Camera className="h-8 w-8" />
      </motion.div>
      
      {/* Sparkle Burst */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400 text-2xl"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1
          }}
          animate={{
            scale: [0, 1, 0.5],
            x: Math.cos(i * 30 * Math.PI / 180) * 150,
            y: Math.sin(i * 30 * Math.PI / 180) * 150,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 1.5,
            delay: 0.3,
            ease: "easeOut"
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );

  const renderStoryTime = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Book Opening Animation */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.1, 1] }}
        transition={{ duration: 1, ease: "backOut" }}
      >
        <motion.div
          className="w-24 h-32 bg-blue-500 rounded-lg shadow-lg"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: [-90, 0] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="p-3 text-white text-center">
            <div className="text-2xl mb-2">📖</div>
            <div className="text-xs">Story</div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Floating Reaction Emojis */}
      {["😍", "😂", "😢", "🤔", "❤️"].map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl"
          initial={{ 
            scale: 0,
            x: Math.random() * 400 - 200,
            y: 50,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0.8],
            y: [50, -100],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            delay: 0.5 + i * 0.2,
            ease: "easeOut"
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );

  const renderHotTopics = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Fire Burst */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <motion.div
          className="bg-red-500 text-white p-4 rounded-full"
          animate={{
            boxShadow: [
              "0 0 0px rgba(239, 68, 68, 0.7)",
              "0 0 30px rgba(239, 68, 68, 0.7)",
              "0 0 0px rgba(239, 68, 68, 0.7)"
            ]
          }}
          transition={{ duration: 1.5, repeat: 2 }}
        >
          <Flame className="h-8 w-8" />
        </motion.div>
      </motion.div>
      
      {/* Fire Emojis Float */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1
          }}
          animate={{
            scale: [0, 1, 0.7],
            x: Math.cos(i * 45 * Math.PI / 180) * 120,
            y: Math.sin(i * 45 * Math.PI / 180) * 120,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 1.2,
            delay: 0.4,
            ease: "easeOut"
          }}
        >
          🔥
        </motion.div>
      ))}
    </div>
  );

  const renderDailyDebate = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Clashing Speech Bubbles */}
      <div className="relative">
        <motion.div
          className="absolute left-[-60px] bg-purple-500 text-white p-3 rounded-lg"
          initial={{ x: -100, scale: 0 }}
          animate={{ 
            x: [-100, 20, 0],
            scale: [0, 1, 1]
          }}
          transition={{ duration: 1, ease: "backOut" }}
        >
          <MessageSquare className="h-6 w-6" />
        </motion.div>
        
        <motion.div
          className="absolute right-[-60px] bg-green-500 text-white p-3 rounded-lg"
          initial={{ x: 100, scale: 0 }}
          animate={{ 
            x: [100, -20, 0],
            scale: [0, 1, 1]
          }}
          transition={{ duration: 1, ease: "backOut" }}
        >
          <MessageSquare className="h-6 w-6" />
        </motion.div>
        
        {/* Lightning Clash Effect */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 1],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Zap className="h-12 w-12 text-yellow-400" />
        </motion.div>
      </div>
    </div>
  );

  const renderTeaExperiments = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Background Color Blip */}
      <motion.div
        className="absolute inset-0 bg-purple-400"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0, 0.3, 0]
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Potion Flask */}
      <motion.div
        className="relative bg-purple-600 text-white p-4 rounded-full"
        initial={{ scale: 0, y: 20 }}
        animate={{ 
          scale: [0, 1.2, 1],
          y: [20, -10, 0]
        }}
        transition={{ duration: 1, ease: "backOut" }}
      >
        <FlaskConical className="h-8 w-8" />
      </motion.div>
      
      {/* Bubbles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-purple-300 rounded-full opacity-70"
          initial={{ 
            scale: 0,
            x: Math.random() * 200 - 100,
            y: 50
          }}
          animate={{
            scale: [0, 1, 0],
            y: [50, -150],
            x: Math.random() * 200 - 100
          }}
          transition={{
            duration: 2,
            delay: Math.random() * 1,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {showAnimation && (
        <>
          {type === "celebrity-tea" && renderCelebrityTea()}
          {type === "story-time" && renderStoryTime()}
          {type === "hot-topics" && renderHotTopics()}
          {type === "daily-debate" && renderDailyDebate()}
          {type === "tea-experiments" && renderTeaExperiments()}
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for triggering celebrations
export function useCelebration() {
  const [celebration, setCelebration] = useState<{
    isVisible: boolean;
    type: CelebrationProps["type"];
  }>({
    isVisible: false,
    type: "celebrity-tea"
  });

  const triggerCelebration = (type: CelebrationProps["type"]) => {
    setCelebration({ isVisible: true, type });
  };

  const completeCelebration = () => {
    setCelebration(prev => ({ ...prev, isVisible: false }));
  };

  return {
    celebration,
    triggerCelebration,
    completeCelebration
  };
}