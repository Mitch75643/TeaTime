import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, Coffee, MessageSquare, Camera, Star } from "lucide-react";

interface WeeklyThemeAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  theme: string;
}

// Audio helper for theme-specific sounds
const playThemeSound = (theme: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    switch (theme.toLowerCase()) {
      case "love week":
        // Soft heart pop sound
        const heartOsc = audioContext.createOscillator();
        const heartGain = audioContext.createGain();
        heartOsc.connect(heartGain);
        heartGain.connect(audioContext.destination);
        heartOsc.type = "sine";
        heartOsc.frequency.setValueAtTime(800, audioContext.currentTime);
        heartOsc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        heartGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        heartGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        heartOsc.start(audioContext.currentTime);
        heartOsc.stop(audioContext.currentTime + 0.3);
        break;
        
      case "rant week":
        // Quick dramatic boom
        const rantOsc = audioContext.createOscillator();
        const rantGain = audioContext.createGain();
        rantOsc.connect(rantGain);
        rantGain.connect(audioContext.destination);
        rantOsc.type = "triangle";
        rantOsc.frequency.setValueAtTime(200, audioContext.currentTime);
        rantOsc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
        rantGain.gain.setValueAtTime(0.12, audioContext.currentTime);
        rantGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        rantOsc.start(audioContext.currentTime);
        rantOsc.stop(audioContext.currentTime + 0.2);
        break;
        
      case "roast week":
        // Tea pour sound
        const teaOsc = audioContext.createOscillator();
        const teaGain = audioContext.createGain();
        const teaFilter = audioContext.createBiquadFilter();
        teaOsc.connect(teaFilter);
        teaFilter.connect(teaGain);
        teaGain.connect(audioContext.destination);
        teaOsc.type = "sine";
        teaFilter.type = "lowpass";
        teaFilter.frequency.setValueAtTime(600, audioContext.currentTime);
        teaOsc.frequency.setValueAtTime(300, audioContext.currentTime);
        teaOsc.frequency.linearRampToValueAtTime(250, audioContext.currentTime + 0.4);
        teaGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        teaGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        teaOsc.start(audioContext.currentTime);
        teaOsc.stop(audioContext.currentTime + 0.4);
        break;
        
      case "unpopular opinions":
        // Speech bubble pop
        const bubbleOsc = audioContext.createOscillator();
        const bubbleGain = audioContext.createGain();
        bubbleOsc.connect(bubbleGain);
        bubbleGain.connect(audioContext.destination);
        bubbleOsc.frequency.setValueAtTime(600, audioContext.currentTime);
        bubbleOsc.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.05);
        bubbleOsc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
        bubbleGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        bubbleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        bubbleOsc.start(audioContext.currentTime);
        bubbleOsc.stop(audioContext.currentTime + 0.15);
        break;
        
      case "chaos week":
        // Lightning zap sound
        const zapOsc = audioContext.createOscillator();
        const zapGain = audioContext.createGain();
        zapOsc.connect(zapGain);
        zapGain.connect(audioContext.destination);
        zapOsc.type = "sawtooth";
        zapOsc.frequency.setValueAtTime(1500, audioContext.currentTime);
        zapOsc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
        zapGain.gain.setValueAtTime(0.15, audioContext.currentTime);
        zapGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        zapOsc.start(audioContext.currentTime);
        zapOsc.stop(audioContext.currentTime + 0.1);
        break;
        
      default:
        // Default gentle water droplet (from celebration animations)
        const defaultOsc = audioContext.createOscillator();
        const defaultGain = audioContext.createGain();
        defaultOsc.connect(defaultGain);
        defaultGain.connect(audioContext.destination);
        defaultOsc.frequency.setValueAtTime(400, audioContext.currentTime);
        defaultOsc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        defaultGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        defaultGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        defaultOsc.start(audioContext.currentTime);
        defaultOsc.stop(audioContext.currentTime + 0.3);
        break;
    }
  } catch (error) {
    console.log("Audio playback not supported");
  }
};

export function WeeklyThemeAnimation({ isVisible, onComplete, theme }: WeeklyThemeAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      playThemeSound(theme);
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, theme, onComplete]);

  const renderLoveWeekAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Floating Hearts */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-pink-500"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0
          }}
          animate={{
            scale: [0, 1.2, 0.8],
            x: (Math.random() - 0.5) * 200,
            y: -150 - Math.random() * 100,
            opacity: [1, 1, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            ease: "easeOut"
          }}
        >
          <Heart className="h-6 w-6 fill-current" />
        </motion.div>
      ))}
      
      {/* Central Love Message */}
      <motion.div
        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <span className="text-sm font-medium">💖 Love is in the air!</span>
      </motion.div>
    </div>
  );

  const renderRantWeekAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Lightning Bolts */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-red-500"
          initial={{ 
            scale: 0,
            x: Math.cos(i * 60 * Math.PI / 180) * 80,
            y: Math.sin(i * 60 * Math.PI / 180) * 80,
            opacity: 0
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.6,
            delay: i * 0.05,
            ease: "easeOut"
          }}
        >
          <Zap className="h-8 w-8 fill-current" />
        </motion.div>
      ))}
      
      {/* Central Rant Message */}
      <motion.div
        className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <span className="text-sm font-medium">😡 Let it all out!</span>
      </motion.div>
    </div>
  );

  const renderRoastWeekAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Tea Splash Effect */}
      <motion.div
        className="absolute"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 1.5, 1], 
          rotate: [0, 180, 360] 
        }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <Coffee className="h-16 w-16 text-yellow-600" />
      </motion.div>
      
      {/* Tea Droplets */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-500 rounded-full"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0
          }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos(i * 30 * Math.PI / 180) * 100,
            y: Math.sin(i * 30 * Math.PI / 180) * 100,
          }}
          transition={{
            duration: 1,
            delay: i * 0.05,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Message */}
      <motion.div
        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg mt-20"
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "backOut" }}
      >
        <span className="text-sm font-medium">☕ Spill that tea!</span>
      </motion.div>
    </div>
  );

  const renderUnpopularOpinionsAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Speech Bubbles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-purple-500"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0.8],
            x: (Math.random() - 0.5) * 160,
            y: -80 - Math.random() * 60,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        >
          <MessageSquare className="h-6 w-6 fill-current" />
        </motion.div>
      ))}
      
      {/* Central Message */}
      <motion.div
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <span className="text-sm font-medium">🤯 Speak your truth!</span>
      </motion.div>
    </div>
  );

  const renderChaosWeekAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Chaotic Lightning Storm */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-green-400"
          initial={{ 
            scale: 0,
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 300,
            opacity: 0,
            rotate: Math.random() * 360
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            rotate: Math.random() * 720
          }}
          transition={{
            duration: 0.4,
            delay: i * 0.05,
            ease: "easeOut"
          }}
        >
          <Zap className="h-6 w-6 fill-current" />
        </motion.div>
      ))}
      
      {/* Tornado Effect */}
      <motion.div
        className="text-6xl"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 1.2, 1], 
          rotate: [0, 720] 
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        🌪️
      </motion.div>
      
      {/* Message */}
      <motion.div
        className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-full shadow-lg mt-20"
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: "backOut" }}
      >
        <span className="text-sm font-medium">🌪️ Embrace the chaos!</span>
      </motion.div>
    </div>
  );

  const getThemeAnimation = () => {
    switch (theme.toLowerCase()) {
      case "love week":
        return renderLoveWeekAnimation();
      case "rant week":
        return renderRantWeekAnimation();
      case "roast week":
        return renderRoastWeekAnimation();
      case "unpopular opinions":
        return renderUnpopularOpinionsAnimation();
      case "chaos week":
        return renderChaosWeekAnimation();
      default:
        return renderLoveWeekAnimation(); // Fallback
    }
  };

  return (
    <AnimatePresence>
      {showAnimation && getThemeAnimation()}
    </AnimatePresence>
  );
}

// Hook for managing weekly theme animations
export function useWeeklyThemeAnimation() {
  const [animation, setAnimation] = useState({
    isVisible: false,
    theme: ""
  });

  const triggerAnimation = (theme: string) => {
    setAnimation({
      isVisible: true,
      theme
    });
  };

  const completeAnimation = () => {
    setAnimation({
      isVisible: false,
      theme: ""
    });
  };

  return {
    animation,
    triggerAnimation,
    completeAnimation
  };
}