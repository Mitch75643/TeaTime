import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, BookOpen, Flame, MessageSquare, Lightbulb, FlaskConical } from "lucide-react";

interface CommunityTopicAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  topic: string;
}

// Global sound cooldown to prevent spam
let lastTopicSoundTime = 0;
const TOPIC_SOUND_COOLDOWN_MS = 3000; // 3 seconds cooldown between sounds

// Topic-specific sound effects
const playTopicSound = (topic: string) => {
  try {
    // Check cooldown period
    const now = Date.now();
    if (now - lastTopicSoundTime < TOPIC_SOUND_COOLDOWN_MS) {
      console.log("Topic sound blocked due to cooldown");
      return;
    }
    lastTopicSoundTime = now;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    switch (topic.toLowerCase()) {
      case "celebrity-tea":
        // Gentle camera click + excited murmur
        const cameraOsc = audioContext.createOscillator();
        const cameraGain = audioContext.createGain();
        cameraOsc.connect(cameraGain);
        cameraGain.connect(audioContext.destination);
        cameraOsc.type = "triangle";
        cameraOsc.frequency.setValueAtTime(1200, audioContext.currentTime);
        cameraOsc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
        cameraGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        cameraGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        cameraOsc.start(audioContext.currentTime);
        cameraOsc.stop(audioContext.currentTime + 0.15);
        
        // Excited murmur background
        setTimeout(() => {
          const murmurOsc = audioContext.createOscillator();
          const murmurGain = audioContext.createGain();
          murmurOsc.connect(murmurGain);
          murmurGain.connect(audioContext.destination);
          murmurOsc.type = "sine";
          murmurOsc.frequency.setValueAtTime(350, audioContext.currentTime);
          murmurGain.gain.setValueAtTime(0.04, audioContext.currentTime);
          murmurGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          murmurOsc.start(audioContext.currentTime);
          murmurOsc.stop(audioContext.currentTime + 0.3);
        }, 100);
        break;
        
      case "story-time":
        // Soft page turn + twinkle
        const pageOsc = audioContext.createOscillator();
        const pageGain = audioContext.createGain();
        const pageFilter = audioContext.createBiquadFilter();
        pageOsc.connect(pageFilter);
        pageFilter.connect(pageGain);
        pageGain.connect(audioContext.destination);
        pageOsc.type = "triangle";
        pageFilter.type = "lowpass";
        pageFilter.frequency.setValueAtTime(600, audioContext.currentTime);
        pageOsc.frequency.setValueAtTime(200, audioContext.currentTime);
        pageOsc.frequency.linearRampToValueAtTime(150, audioContext.currentTime + 0.2);
        pageGain.gain.setValueAtTime(0.06, audioContext.currentTime);
        pageGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        pageOsc.start(audioContext.currentTime);
        pageOsc.stop(audioContext.currentTime + 0.4);
        
        // Magical twinkle
        setTimeout(() => {
          const twinkleOsc = audioContext.createOscillator();
          const twinkleGain = audioContext.createGain();
          twinkleOsc.connect(twinkleGain);
          twinkleGain.connect(audioContext.destination);
          twinkleOsc.frequency.setValueAtTime(1800, audioContext.currentTime);
          twinkleOsc.frequency.exponentialRampToValueAtTime(2400, audioContext.currentTime + 0.1);
          twinkleGain.gain.setValueAtTime(0.05, audioContext.currentTime);
          twinkleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          twinkleOsc.start(audioContext.currentTime);
          twinkleOsc.stop(audioContext.currentTime + 0.2);
        }, 200);
        break;
        
      case "hot-topics":
        // Soft fire crackle/sizzle
        const fireOsc1 = audioContext.createOscillator();
        const fireOsc2 = audioContext.createOscillator();
        const fireGain = audioContext.createGain();
        const fireFilter = audioContext.createBiquadFilter();
        fireOsc1.connect(fireFilter);
        fireOsc2.connect(fireFilter);
        fireFilter.connect(fireGain);
        fireGain.connect(audioContext.destination);
        fireOsc1.type = "sawtooth";
        fireOsc2.type = "triangle";
        fireFilter.type = "lowpass";
        fireFilter.frequency.setValueAtTime(400, audioContext.currentTime);
        fireOsc1.frequency.setValueAtTime(120, audioContext.currentTime);
        fireOsc2.frequency.setValueAtTime(180, audioContext.currentTime);
        fireGain.gain.setValueAtTime(0.07, audioContext.currentTime);
        fireGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        fireOsc1.start(audioContext.currentTime);
        fireOsc1.stop(audioContext.currentTime + 0.5);
        fireOsc2.start(audioContext.currentTime);
        fireOsc2.stop(audioContext.currentTime + 0.5);
        break;
        
      case "daily-debate":
        // Soft "hmm" thinking sound
        const thinkOsc = audioContext.createOscillator();
        const thinkGain = audioContext.createGain();
        thinkOsc.connect(thinkGain);
        thinkGain.connect(audioContext.destination);
        thinkOsc.type = "sine";
        thinkOsc.frequency.setValueAtTime(300, audioContext.currentTime);
        thinkOsc.frequency.linearRampToValueAtTime(280, audioContext.currentTime + 0.3);
        thinkGain.gain.setValueAtTime(0.06, audioContext.currentTime);
        thinkGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        thinkOsc.start(audioContext.currentTime);
        thinkOsc.stop(audioContext.currentTime + 0.4);
        break;
        
      case "tea-experiments":
        // Playful fizz-pop (use existing chemistry sound but lighter)
        const fizzOsc = audioContext.createOscillator();
        const fizzGain = audioContext.createGain();
        fizzOsc.connect(fizzGain);
        fizzGain.connect(audioContext.destination);
        fizzOsc.type = "sine";
        fizzOsc.frequency.setValueAtTime(600, audioContext.currentTime);
        fizzOsc.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.05);
        fizzOsc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
        fizzGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        fizzGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        fizzOsc.start(audioContext.currentTime);
        fizzOsc.stop(audioContext.currentTime + 0.2);
        break;
        
      case "feedback-suggestions":
        // Calm "ding" of realization
        const dingOsc = audioContext.createOscillator();
        const dingGain = audioContext.createGain();
        dingOsc.connect(dingGain);
        dingGain.connect(audioContext.destination);
        dingOsc.type = "sine";
        dingOsc.frequency.setValueAtTime(800, audioContext.currentTime);
        dingOsc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        dingOsc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
        dingGain.gain.setValueAtTime(0.07, audioContext.currentTime);
        dingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        dingOsc.start(audioContext.currentTime);
        dingOsc.stop(audioContext.currentTime + 0.4);
        break;
        
      default:
        // Default gentle sound
        const defaultOsc = audioContext.createOscillator();
        const defaultGain = audioContext.createGain();
        defaultOsc.connect(defaultGain);
        defaultGain.connect(audioContext.destination);
        defaultOsc.frequency.setValueAtTime(400, audioContext.currentTime);
        defaultOsc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
        defaultGain.gain.setValueAtTime(0.06, audioContext.currentTime);
        defaultGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        defaultOsc.start(audioContext.currentTime);
        defaultOsc.stop(audioContext.currentTime + 0.3);
        break;
    }
  } catch (error) {
    console.log("Audio playback not supported");
  }
};

export function CommunityTopicAnimation({ isVisible, onComplete, topic }: CommunityTopicAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      playTopicSound(topic);
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete();
      }, 1800);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, topic, onComplete]);

  const renderCelebrityTeaAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Paparazzi Camera Flash */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.2, times: [0, 0.5, 1] }}
      />
      
      {/* Camera Icon */}
      <motion.div
        className="text-gray-800 z-10"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotate: [0, -10, 5, 0]
        }}
        transition={{ duration: 0.6, ease: "backOut" }}
      >
        <Camera className="h-12 w-12" />
      </motion.div>
      
      {/* Sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          initial={{ 
            scale: 0,
            x: Math.cos(i * 45 * Math.PI / 180) * 20,
            y: Math.sin(i * 45 * Math.PI / 180) * 20,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos(i * 45 * Math.PI / 180) * 80,
            y: Math.sin(i * 45 * Math.PI / 180) * 80,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1,
            delay: 0.2 + i * 0.05,
            ease: "easeOut"
          }}
        >
          ⭐
        </motion.div>
      ))}
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "backOut" }}
      >
        <span className="text-sm font-medium">📸 Celebrity tea spilled!</span>
      </motion.div>
    </div>
  );

  const renderStoryTimeAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Glowing Open Book */}
      <motion.div
        className="relative"
        initial={{ scale: 0, rotateY: -90 }}
        animate={{ 
          scale: [0, 1.1, 1],
          rotateY: [-90, 0]
        }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <BookOpen className="h-16 w-16 text-amber-600" />
        
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-amber-300 rounded-full blur-xl opacity-30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: 1,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* Magical Sparkles Rising */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-amber-400"
          initial={{ 
            scale: 0,
            x: (Math.random() - 0.5) * 40,
            y: 20,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: (Math.random() - 0.5) * 80,
            y: -120 - Math.random() * 60,
            opacity: [0, 1, 0.8, 0],
            rotate: Math.random() * 360
          }}
          transition={{
            duration: 1.8,
            delay: i * 0.1,
            ease: "easeOut"
          }}
        >
          ✨
        </motion.div>
      ))}
      
      {/* Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "backOut" }}
      >
        <span className="text-sm font-medium">📖 Story unlocked!</span>
      </motion.div>
    </div>
  );

  const renderHotTopicsAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Flickering Flame */}
      <motion.div
        className="text-6xl"
        initial={{ scale: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotateZ: [0, -5, 5, -3, 3, 0]
        }}
        transition={{ 
          duration: 1.2,
          ease: "easeOut"
        }}
      >
        🔥
      </motion.div>
      
      {/* Fire Trail Effect */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ 
            scale: 0,
            x: 0,
            y: 20
          }}
          animate={{
            scale: [0, 1, 0],
            x: (Math.random() - 0.5) * 60,
            y: 40 + i * 15,
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 0.8,
            delay: 0.3 + i * 0.1,
            ease: "easeOut"
          }}
        >
          <Flame className="h-4 w-4 text-red-500" />
        </motion.div>
      ))}
      
      {/* Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "backOut" }}
      >
        <span className="text-sm font-medium">🔥 That's hot!</span>
      </motion.div>
    </div>
  );

  const renderDailyDebateAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Thought Bubbles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ 
            scale: 0,
            x: Math.cos(i * 90 * Math.PI / 180) * 60,
            y: Math.sin(i * 90 * Math.PI / 180) * 60,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0.8],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        >
          <MessageSquare className="h-8 w-8 text-blue-500" />
        </motion.div>
      ))}
      
      {/* Question Marks */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl text-purple-600"
          initial={{ 
            scale: 0,
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 1,
            delay: 0.3 + i * 0.15,
            ease: "easeOut"
          }}
        >
          ❓
        </motion.div>
      ))}
      
      {/* Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7, ease: "backOut" }}
      >
        <span className="text-sm font-medium">💭 Let the debate begin!</span>
      </motion.div>
    </div>
  );

  const renderFeedbackSuggestionsAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Pulsing Lightbulb */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ 
          scale: [0, 1.2, 1]
        }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <Lightbulb className="h-16 w-16 text-yellow-500" />
        
        {/* Pulse Rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 border-2 border-yellow-400 rounded-full"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{
              scale: [1, 2.5],
              opacity: [0.8, 0]
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.3,
              ease: "easeOut"
            }}
          />
        ))}
      </motion.div>
      
      {/* Spark Animation */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0
          }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos(i * 60 * Math.PI / 180) * 80,
            y: Math.sin(i * 60 * Math.PI / 180) * 80,
          }}
          transition={{
            duration: 1,
            delay: 0.4 + i * 0.05,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: "backOut" }}
      >
        <span className="text-sm font-medium">💡 Great idea shared!</span>
      </motion.div>
    </div>
  );

  const getTopicAnimation = () => {
    switch (topic.toLowerCase()) {
      case "celebrity-tea":
        return renderCelebrityTeaAnimation();
      case "story-time":
        return renderStoryTimeAnimation();
      case "hot-topics":
        return renderHotTopicsAnimation();
      case "daily-debate":
        return renderDailyDebateAnimation();
      case "tea-experiments":
        // Use existing chemistry animation for tea experiments
        return null;
      case "feedback-suggestions":
        return renderFeedbackSuggestionsAnimation();
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {showAnimation && getTopicAnimation()}
    </AnimatePresence>
  );
}

// Hook for managing community topic animations
export function useCommunityTopicAnimation() {
  const [animation, setAnimation] = useState({
    isVisible: false,
    topic: ""
  });

  const triggerAnimation = (topic: string) => {
    setAnimation({
      isVisible: true,
      topic
    });
  };

  const completeAnimation = () => {
    setAnimation({
      isVisible: false,
      topic: ""
    });
  };

  return {
    animation,
    triggerAnimation,
    completeAnimation
  };
}