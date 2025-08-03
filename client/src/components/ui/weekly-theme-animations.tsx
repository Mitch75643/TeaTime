import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, Coffee, MessageSquare, Camera, Star } from "lucide-react";

interface WeeklyThemeAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  theme: string;
}

// Weekly theme configuration for easy updates
const THEME_CONFIG = {
  "Love Week": {
    colors: ["#FF7A00", "#FFD8B2", "#CC6200"],
    sound: "romantic-chime"
  },
  "Pet Peeves Week": {
    colors: ["#ff4500", "#ff6347", "#ffa500"],
    sound: "grumble"
  },
  "Cringe/Funny Week": {
    colors: ["#ffd700", "#ffff00", "#ff69b4"],
    sound: "giggle"
  },
  "Secrets Week": {
    colors: ["#FF7A00", "#CC6200", "#3C2E20"],
    sound: "whisper"
  },
  "Embarrassing Moments Week": {
    colors: ["#FF7A00", "#FFD8B2", "#FFE5D1"],
    sound: "gasp"
  },
  "Drama Week": {
    colors: ["#ff0000", "#dc143c", "#b22222"],
    sound: "dramatic-sting"
  },
  "Self-Care Week": {
    colors: ["#98fb98", "#90ee90", "#87ceeb"],
    sound: "spa-chime"
  },
  // Existing themes
  "Rant Week": {
    colors: ["#FF7A00", "#CC6200", "#FFD8B2"],
    sound: "grumble"
  },
  "Roast Week": {
    colors: ["#FF7A00", "#FFD8B2", "#FFE5D1"],
    sound: "giggle"
  },
  "Unpopular Opinions": {
    colors: ["#FF7A00", "#CC6200", "#3C2E20"],
    sound: "bubble-pop"
  },
  "Chaos Week": {
    colors: ["#32cd32", "#20b2aa", "#00ced1"],
    sound: "chaos-swirl"
  }
};

// Audio helper for theme-specific sounds
const playThemeSound = (theme: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const config = THEME_CONFIG[theme as keyof typeof THEME_CONFIG];
    const soundType = config?.sound || "default";
    
    switch (soundType) {
      case "romantic-chime":
        // Soft romantic chime for Love Week
        const heartOsc = audioContext.createOscillator();
        const heartGain = audioContext.createGain();
        heartOsc.connect(heartGain);
        heartGain.connect(audioContext.destination);
        heartOsc.type = "sine";
        heartOsc.frequency.setValueAtTime(800, audioContext.currentTime);
        heartOsc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        heartGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        heartGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        heartOsc.start(audioContext.currentTime);
        heartOsc.stop(audioContext.currentTime + 0.4);
        break;
        
      case "grumble":
        // Quiet grumble for Pet Peeves/Rant Week
        const grumbleOsc = audioContext.createOscillator();
        const grumbleGain = audioContext.createGain();
        const grumbleFilter = audioContext.createBiquadFilter();
        grumbleOsc.connect(grumbleFilter);
        grumbleFilter.connect(grumbleGain);
        grumbleGain.connect(audioContext.destination);
        grumbleOsc.type = "sawtooth";
        grumbleFilter.type = "lowpass";
        grumbleFilter.frequency.setValueAtTime(200, audioContext.currentTime);
        grumbleOsc.frequency.setValueAtTime(80, audioContext.currentTime);
        grumbleOsc.frequency.linearRampToValueAtTime(60, audioContext.currentTime + 0.3);
        grumbleGain.gain.setValueAtTime(0.06, audioContext.currentTime);
        grumbleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        grumbleOsc.start(audioContext.currentTime);
        grumbleOsc.stop(audioContext.currentTime + 0.3);
        break;
        
      case "giggle":
        // Playful light giggle for Cringe/Funny Week
        const giggleOsc = audioContext.createOscillator();
        const giggleGain = audioContext.createGain();
        giggleOsc.connect(giggleGain);
        giggleGain.connect(audioContext.destination);
        giggleOsc.type = "triangle";
        giggleOsc.frequency.setValueAtTime(600, audioContext.currentTime);
        giggleOsc.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.05);
        giggleOsc.frequency.exponentialRampToValueAtTime(700, audioContext.currentTime + 0.1);
        giggleOsc.frequency.exponentialRampToValueAtTime(850, audioContext.currentTime + 0.15);
        giggleGain.gain.setValueAtTime(0.07, audioContext.currentTime);
        giggleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        giggleOsc.start(audioContext.currentTime);
        giggleOsc.stop(audioContext.currentTime + 0.2);
        break;
        
      case "whisper":
        // Soft whisper "shh" for Secrets Week
        const whisperOsc = audioContext.createOscillator();
        const whisperGain = audioContext.createGain();
        const whisperFilter = audioContext.createBiquadFilter();
        whisperOsc.connect(whisperFilter);
        whisperFilter.connect(whisperGain);
        whisperGain.connect(audioContext.destination);
        whisperOsc.type = "sine";
        whisperFilter.type = "highpass";
        whisperFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
        whisperOsc.frequency.setValueAtTime(2000, audioContext.currentTime);
        whisperOsc.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.5);
        whisperGain.gain.setValueAtTime(0.04, audioContext.currentTime);
        whisperGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        whisperOsc.start(audioContext.currentTime);
        whisperOsc.stop(audioContext.currentTime + 0.5);
        break;
        
      case "gasp":
        // Soft gasp for Embarrassing Moments Week
        const gaspOsc = audioContext.createOscillator();
        const gaspGain = audioContext.createGain();
        gaspOsc.connect(gaspGain);
        gaspGain.connect(audioContext.destination);
        gaspOsc.type = "sine";
        gaspOsc.frequency.setValueAtTime(400, audioContext.currentTime);
        gaspOsc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
        gaspOsc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        gaspGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gaspGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        gaspOsc.start(audioContext.currentTime);
        gaspOsc.stop(audioContext.currentTime + 0.25);
        break;
        
      case "dramatic-sting":
        // Soft dramatic sting for Drama Week
        const dramOsc1 = audioContext.createOscillator();
        const dramOsc2 = audioContext.createOscillator();
        const dramGain = audioContext.createGain();
        dramOsc1.connect(dramGain);
        dramOsc2.connect(dramGain);
        dramGain.connect(audioContext.destination);
        dramOsc1.type = "triangle";
        dramOsc2.type = "sine";
        dramOsc1.frequency.setValueAtTime(300, audioContext.currentTime);
        dramOsc2.frequency.setValueAtTime(450, audioContext.currentTime);
        dramOsc1.frequency.linearRampToValueAtTime(280, audioContext.currentTime + 0.4);
        dramOsc2.frequency.linearRampToValueAtTime(420, audioContext.currentTime + 0.4);
        dramGain.gain.setValueAtTime(0.07, audioContext.currentTime);
        dramGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        dramOsc1.start(audioContext.currentTime);
        dramOsc2.start(audioContext.currentTime);
        dramOsc1.stop(audioContext.currentTime + 0.4);
        dramOsc2.stop(audioContext.currentTime + 0.4);
        break;
        
      case "spa-chime":
        // Gentle spa-like chime for Self-Care Week
        const spaOsc = audioContext.createOscillator();
        const spaGain = audioContext.createGain();
        spaOsc.connect(spaGain);
        spaGain.connect(audioContext.destination);
        spaOsc.type = "sine";
        spaOsc.frequency.setValueAtTime(528, audioContext.currentTime); // "Love frequency"
        spaGain.gain.setValueAtTime(0.06, audioContext.currentTime);
        spaGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        spaOsc.start(audioContext.currentTime);
        spaOsc.stop(audioContext.currentTime + 0.8);
        break;
        
      case "bubble-pop":
        // Speech bubble pop for Unpopular Opinions
        const bubbleOsc = audioContext.createOscillator();
        const bubbleGain = audioContext.createGain();
        bubbleOsc.connect(bubbleGain);
        bubbleGain.connect(audioContext.destination);
        bubbleOsc.frequency.setValueAtTime(600, audioContext.currentTime);
        bubbleOsc.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.05);
        bubbleOsc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
        bubbleGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        bubbleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        bubbleOsc.start(audioContext.currentTime);
        bubbleOsc.stop(audioContext.currentTime + 0.15);
        break;
        
      case "chaos-swirl":
        // Lightning zap sound for Chaos Week
        const zapOsc = audioContext.createOscillator();
        const zapGain = audioContext.createGain();
        zapOsc.connect(zapGain);
        zapGain.connect(audioContext.destination);
        zapOsc.type = "sawtooth";
        zapOsc.frequency.setValueAtTime(1500, audioContext.currentTime);
        zapOsc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
        zapGain.gain.setValueAtTime(0.06, audioContext.currentTime);
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
          className="absolute text-orange-500"
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