import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Zap, Flame, MessageSquare, FlaskConical, Bug, Lightbulb, MessageCircle } from "lucide-react";

interface CelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
  type: "celebrity-tea" | "story-time" | "hot-topics" | "daily-debate" | "tea-experiments" | "bug-report" | "feature-request" | "general-feedback";
}

// Global sound control to prevent spam
let lastSoundTime = 0;
let soundDisabledUntil = 0;
const SOUND_COOLDOWN_MS = 3000; // 3 seconds cooldown between sounds
const SOUND_DISABLE_DURATION = 2000; // 2 seconds disable after posting

// Function to disable sounds temporarily after posting
const disableSoundsTemporarily = () => {
  soundDisabledUntil = Date.now() + SOUND_DISABLE_DURATION;
  console.log("Sounds disabled for 2 seconds after posting");
};

// Make this function available globally
(window as any).disableSoundsTemporarily = disableSoundsTemporarily;

// Audio helper function
const playSound = (soundType: string) => {
  try {
    const now = Date.now();
    
    // Check if sounds are temporarily disabled
    if (now < soundDisabledUntil) {
      console.log("Sound blocked - temporarily disabled after posting");
      return;
    }
    
    // Check cooldown period
    if (now - lastSoundTime < SOUND_COOLDOWN_MS) {
      console.log("Sound blocked due to cooldown");
      return;
    }
    lastSoundTime = now;

    // Create simple audio using Web Audio API for sound effects
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    switch (soundType) {
      case "twinkle":
        // Soft water droplet sound - gentle and natural
        const dropOsc = audioContext.createOscillator();
        const dropGain = audioContext.createGain();
        const dropFilter = audioContext.createBiquadFilter();
        
        dropOsc.connect(dropFilter);
        dropFilter.connect(dropGain);
        dropGain.connect(audioContext.destination);
        
        dropOsc.type = "sine";
        dropFilter.type = "lowpass";
        dropFilter.frequency.setValueAtTime(800, audioContext.currentTime);
        
        // Create a gentle droplet effect
        dropOsc.frequency.setValueAtTime(400, audioContext.currentTime);
        dropOsc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        dropOsc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        
        dropGain.gain.setValueAtTime(0, audioContext.currentTime);
        dropGain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
        dropGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
        
        dropOsc.start(audioContext.currentTime);
        dropOsc.stop(audioContext.currentTime + 0.35);
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
        
      case "flame-whoosh":
        // Soft flame whoosh sound
        const flameOsc = audioContext.createOscillator();
        const flameGain = audioContext.createGain();
        flameOsc.connect(flameGain);
        flameGain.connect(audioContext.destination);
        flameOsc.type = "sine";
        flameOsc.frequency.setValueAtTime(300, audioContext.currentTime);
        flameOsc.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.3);
        flameGain.gain.setValueAtTime(0.12, audioContext.currentTime);
        flameGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        flameOsc.start(audioContext.currentTime);
        flameOsc.stop(audioContext.currentTime + 0.3);
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
        
      case "bubbling":
        // Soft bubbling lab sound
        const bubbleOsc = audioContext.createOscillator();
        const bubbleGain = audioContext.createGain();
        bubbleOsc.connect(bubbleGain);
        bubbleGain.connect(audioContext.destination);
        bubbleOsc.type = "sine";
        bubbleOsc.frequency.setValueAtTime(250, audioContext.currentTime);
        bubbleOsc.frequency.setValueAtTime(350, audioContext.currentTime + 0.1);
        bubbleOsc.frequency.setValueAtTime(280, audioContext.currentTime + 0.2);
        bubbleGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        bubbleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        bubbleOsc.start(audioContext.currentTime);
        bubbleOsc.stop(audioContext.currentTime + 0.4);
        break;
        
      case "ping":
        // Soft ping for bug reports
        const pingOsc = audioContext.createOscillator();
        const pingGain = audioContext.createGain();
        pingOsc.connect(pingGain);
        pingGain.connect(audioContext.destination);
        pingOsc.frequency.setValueAtTime(800, audioContext.currentTime);
        pingGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        pingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        pingOsc.start(audioContext.currentTime);
        pingOsc.stop(audioContext.currentTime + 0.2);
        break;
        
      case "ding":
        // Lightbulb ding for feature requests
        const dingOsc = audioContext.createOscillator();
        const dingGain = audioContext.createGain();
        dingOsc.connect(dingGain);
        dingGain.connect(audioContext.destination);
        dingOsc.frequency.setValueAtTime(1000, audioContext.currentTime);
        dingOsc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        dingGain.gain.setValueAtTime(0.12, audioContext.currentTime);
        dingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        dingOsc.start(audioContext.currentTime);
        dingOsc.stop(audioContext.currentTime + 0.3);
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
      
      // Play sound effect - using soft water droplet sound for all topics
      playSound("twinkle");
      
      // Auto-hide after animation - 1.5 seconds max
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, type, onComplete]);

  const renderCelebrityTea = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Central Starburst */}
      <motion.div
        className="absolute bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-full"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 1.3, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 1.2, ease: "backOut" }}
      >
        <div className="text-2xl">⭐</div>
      </motion.div>
      
      {/* Sparkle and Glitter Burst */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0
          }}
          animate={{
            scale: [0, 1.2, 0.8],
            x: Math.cos(i * 22.5 * Math.PI / 180) * 180,
            y: Math.sin(i * 22.5 * Math.PI / 180) * 180,
            opacity: [1, 1, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 1.8,
            delay: 0.2,
            ease: "easeOut"
          }}
        >
          {i % 2 === 0 ? "✨" : "💫"}
        </motion.div>
      ))}
      
      {/* Gentle Twinkle Effects */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`twinkle-${i}`}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full"
          initial={{ 
            scale: 0,
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1,
            delay: Math.random() * 1.5,
            ease: "easeInOut"
          }}
        />
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
      {["😍", "😂", "😲", "🤔", "❤️"].map((emoji, i) => (
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
      {/* Heatwave Center */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 1, ease: "backOut" }}
      >
        <motion.div
          className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 rounded-full"
          animate={{
            boxShadow: [
              "0 0 0px rgba(251, 146, 60, 0.5)",
              "0 0 40px rgba(251, 146, 60, 0.8)",
              "0 0 20px rgba(251, 146, 60, 0.6)"
            ]
          }}
          transition={{ duration: 2, repeat: 1 }}
        >
          <Flame className="h-8 w-8" />
        </motion.div>
      </motion.div>
      
      {/* Heatwave Ripples */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute border-2 border-orange-300 rounded-full"
          initial={{ 
            width: 0,
            height: 0,
            opacity: 0.8
          }}
          animate={{
            width: [0, 200 + i * 50, 300 + i * 50],
            height: [0, 200 + i * 50, 300 + i * 50],
            opacity: [0.8, 0.4, 0]
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.3,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Floating Flame Emojis */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1
          }}
          animate={{
            scale: [0, 1, 0.8],
            x: Math.cos(i * 60 * Math.PI / 180) * 140,
            y: Math.sin(i * 60 * Math.PI / 180) * 140,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 1.4,
            delay: 0.5,
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
        className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0, 0.2, 0]
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      {/* Chemical Burst Center */}
      <motion.div
        className="relative bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-5 rounded-full"
        initial={{ scale: 0, y: 20 }}
        animate={{ 
          scale: [0, 1.3, 1],
          y: [20, -10, 0]
        }}
        transition={{ duration: 1.2, ease: "backOut" }}
      >
        <FlaskConical className="h-10 w-10" />
      </motion.div>
      
      {/* Colorful Chemical Burst */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`chemical-${i}`}
          className={`absolute w-6 h-6 rounded-full ${
            i % 4 === 0 ? 'bg-orange-400' : 
            i % 4 === 1 ? 'bg-orange-500' : 
            i % 4 === 2 ? 'bg-orange-600' : 'bg-orange-300'
          }`}
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1
          }}
          animate={{
            scale: [0, 1.2, 0.6],
            x: Math.cos(i * 30 * Math.PI / 180) * 160,
            y: Math.sin(i * 30 * Math.PI / 180) * 160,
            opacity: [1, 0.8, 0]
          }}
          transition={{
            duration: 1.8,
            delay: 0.3,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Bubbling Effect */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`bubble-${i}`}
          className="absolute w-3 h-3 bg-white rounded-full opacity-60"
          initial={{ 
            scale: 0,
            x: Math.random() * 300 - 150,
            y: 100
          }}
          animate={{
            scale: [0, 1, 0],
            y: [100, -200],
            x: Math.random() * 300 - 150
          }}
          transition={{
            duration: 2.5,
            delay: Math.random() * 1.5,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );

  const renderBugReport = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Bug Icon */}
      <motion.div
        className="relative bg-red-500 text-white p-4 rounded-full"
        initial={{ scale: 0, y: 20 }}
        animate={{ 
          scale: [0, 1.2, 1],
          y: [20, -10, 10, 0]
        }}
        transition={{ duration: 1, ease: "backOut" }}
      >
        <Bug className="h-8 w-8" />
      </motion.div>
      
      {/* Flutter Effect */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-red-500 text-2xl"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0
          }}
          animate={{
            scale: [0, 1, 0.5],
            x: Math.cos(i * 60 * Math.PI / 180) * 100,
            y: Math.sin(i * 60 * Math.PI / 180) * 100 - 20,
            opacity: [1, 0.8, 0],
            rotate: [0, 180]
          }}
          transition={{
            duration: 1.5,
            delay: 0.3,
            ease: "easeOut"
          }}
        >
          🐛
        </motion.div>
      ))}
    </div>
  );

  const renderFeatureRequest = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Lightbulb Icon */}
      <motion.div
        className="relative bg-yellow-400 text-gray-800 p-4 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.3, 1],
          opacity: [0, 1, 1]
        }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <motion.div
          animate={{
            filter: [
              "brightness(1) drop-shadow(0 0 0px rgba(255, 255, 0, 0.7))",
              "brightness(1.3) drop-shadow(0 0 20px rgba(255, 255, 0, 0.9))",
              "brightness(1) drop-shadow(0 0 10px rgba(255, 255, 0, 0.7))"
            ]
          }}
          transition={{ duration: 1.5, repeat: 1 }}
        >
          <Lightbulb className="h-8 w-8" />
        </motion.div>
      </motion.div>
      
      {/* Idea Sparks */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400 text-xl"
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
          💡
        </motion.div>
      ))}
    </div>
  );

  const renderGeneralFeedback = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Speech Bubble */}
      <motion.div
        className="relative bg-blue-500 text-white p-4 rounded-full"
        initial={{ scale: 0, y: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          y: [0, -20, 0]
        }}
        transition={{ duration: 1, ease: "backOut" }}
      >
        <MessageCircle className="h-8 w-8" />
      </motion.div>
      
      {/* Floating Comments */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-blue-400 text-3xl"
          initial={{ 
            scale: 0,
            x: Math.random() * 200 - 100,
            y: 20,
            opacity: 1
          }}
          animate={{
            scale: [0, 1, 0.8],
            y: [20, -120],
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 2,
            delay: 0.3 + i * 0.2,
            ease: "easeOut"
          }}
        >
          💬
        </motion.div>
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
          {type === "bug-report" && renderBugReport()}
          {type === "feature-request" && renderFeatureRequest()}
          {type === "general-feedback" && renderGeneralFeedback()}
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