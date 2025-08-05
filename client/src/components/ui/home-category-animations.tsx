import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Briefcase, Heart, Home, DollarSign, Flame, Scale } from "lucide-react";

interface HomeCategoryAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  category: string;
}

// Category-specific sound effects
const playCategorySound = (category: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    switch (category.toLowerCase()) {
      case "school":
        // Soft page flip sound
        const pageOsc = audioContext.createOscillator();
        const pageGain = audioContext.createGain();
        const pageFilter = audioContext.createBiquadFilter();
        pageOsc.connect(pageFilter);
        pageFilter.connect(pageGain);
        pageGain.connect(audioContext.destination);
        pageOsc.type = "triangle";
        pageFilter.type = "lowpass";
        pageFilter.frequency.setValueAtTime(500, audioContext.currentTime);
        pageOsc.frequency.setValueAtTime(180, audioContext.currentTime);
        pageOsc.frequency.linearRampToValueAtTime(120, audioContext.currentTime + 0.3);
        pageGain.gain.setValueAtTime(0.06, audioContext.currentTime);
        pageGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        pageOsc.start(audioContext.currentTime);
        pageOsc.stop(audioContext.currentTime + 0.4);
        break;
        
      case "work":
        // Soft keyboard typing + email sent sound
        const typeOsc = audioContext.createOscillator();
        const typeGain = audioContext.createGain();
        typeOsc.connect(typeGain);
        typeGain.connect(audioContext.destination);
        typeOsc.type = "square";
        typeOsc.frequency.setValueAtTime(400, audioContext.currentTime);
        typeGain.gain.setValueAtTime(0.04, audioContext.currentTime);
        typeGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        typeOsc.start(audioContext.currentTime);
        typeOsc.stop(audioContext.currentTime + 0.1);
        
        // Soft email sent swoosh
        setTimeout(() => {
          const swooshOsc = audioContext.createOscillator();
          const swooshGain = audioContext.createGain();
          const swooshFilter = audioContext.createBiquadFilter();
          swooshOsc.connect(swooshFilter);
          swooshFilter.connect(swooshGain);
          swooshGain.connect(audioContext.destination);
          swooshOsc.type = "sine";
          swooshFilter.type = "lowpass";
          swooshFilter.frequency.setValueAtTime(800, audioContext.currentTime);
          swooshOsc.frequency.setValueAtTime(600, audioContext.currentTime);
          swooshOsc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
          swooshGain.gain.setValueAtTime(0.05, audioContext.currentTime);
          swooshGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          swooshOsc.start(audioContext.currentTime);
          swooshOsc.stop(audioContext.currentTime + 0.3);
        }, 150);
        break;
        
      case "relationships":
        // Calm heartbeat
        const heartOsc = audioContext.createOscillator();
        const heartGain = audioContext.createGain();
        heartOsc.connect(heartGain);
        heartGain.connect(audioContext.destination);
        heartOsc.type = "sine";
        heartOsc.frequency.setValueAtTime(80, audioContext.currentTime);
        heartGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        heartGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        heartOsc.start(audioContext.currentTime);
        heartOsc.stop(audioContext.currentTime + 0.1);
        
        // Second heartbeat
        setTimeout(() => {
          const heart2Osc = audioContext.createOscillator();
          const heart2Gain = audioContext.createGain();
          heart2Osc.connect(heart2Gain);
          heart2Gain.connect(audioContext.destination);
          heart2Osc.type = "sine";
          heart2Osc.frequency.setValueAtTime(80, audioContext.currentTime);
          heart2Gain.gain.setValueAtTime(0.08, audioContext.currentTime);
          heart2Gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          heart2Osc.start(audioContext.currentTime);
          heart2Osc.stop(audioContext.currentTime + 0.1);
        }, 200);
        break;
        
      case "family":
        // Gentle hum/lullaby chord
        const chord1Osc = audioContext.createOscillator();
        const chord2Osc = audioContext.createOscillator();
        const chord3Osc = audioContext.createOscillator();
        const chordGain = audioContext.createGain();
        chord1Osc.connect(chordGain);
        chord2Osc.connect(chordGain);
        chord3Osc.connect(chordGain);
        chordGain.connect(audioContext.destination);
        chord1Osc.type = "sine";
        chord2Osc.type = "sine";
        chord3Osc.type = "sine";
        chord1Osc.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
        chord2Osc.frequency.setValueAtTime(329.63, audioContext.currentTime); // E4
        chord3Osc.frequency.setValueAtTime(392.00, audioContext.currentTime); // G4
        chordGain.gain.setValueAtTime(0.04, audioContext.currentTime);
        chordGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        chord1Osc.start(audioContext.currentTime);
        chord2Osc.start(audioContext.currentTime);
        chord3Osc.start(audioContext.currentTime);
        chord1Osc.stop(audioContext.currentTime + 0.8);
        chord2Osc.stop(audioContext.currentTime + 0.8);
        chord3Osc.stop(audioContext.currentTime + 0.8);
        break;
        
      case "money":
        // Soft coin jingle
        const coinOsc1 = audioContext.createOscillator();
        const coinOsc2 = audioContext.createOscillator();
        const coinGain = audioContext.createGain();
        coinOsc1.connect(coinGain);
        coinOsc2.connect(coinGain);
        coinGain.connect(audioContext.destination);
        coinOsc1.type = "triangle";
        coinOsc2.type = "triangle";
        coinOsc1.frequency.setValueAtTime(800, audioContext.currentTime);
        coinOsc2.frequency.setValueAtTime(1200, audioContext.currentTime);
        coinGain.gain.setValueAtTime(0.06, audioContext.currentTime);
        coinGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        coinOsc1.start(audioContext.currentTime);
        coinOsc2.start(audioContext.currentTime);
        coinOsc1.stop(audioContext.currentTime + 0.3);
        coinOsc2.stop(audioContext.currentTime + 0.3);
        
        // Gentle cha-ching echo
        setTimeout(() => {
          const chingOsc = audioContext.createOscillator();
          const chingGain = audioContext.createGain();
          chingOsc.connect(chingGain);
          chingGain.connect(audioContext.destination);
          chingOsc.frequency.setValueAtTime(1000, audioContext.currentTime);
          chingOsc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
          chingGain.gain.setValueAtTime(0.04, audioContext.currentTime);
          chingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          chingOsc.start(audioContext.currentTime);
          chingOsc.stop(audioContext.currentTime + 0.2);
        }, 200);
        break;
        
      case "hot-takes":
        // Subtle flame burst
        const flameOsc = audioContext.createOscillator();
        const flameGain = audioContext.createGain();
        const flameFilter = audioContext.createBiquadFilter();
        flameOsc.connect(flameFilter);
        flameFilter.connect(flameGain);
        flameGain.connect(audioContext.destination);
        flameOsc.type = "sawtooth";
        flameFilter.type = "lowpass";
        flameFilter.frequency.setValueAtTime(300, audioContext.currentTime);
        flameOsc.frequency.setValueAtTime(150, audioContext.currentTime);
        flameOsc.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.4);
        flameGain.gain.setValueAtTime(0.07, audioContext.currentTime);
        flameGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        flameOsc.start(audioContext.currentTime);
        flameOsc.stop(audioContext.currentTime + 0.4);
        break;
        
      case "wrong":
        // Light suspense swell
        const suspenseOsc = audioContext.createOscillator();
        const suspenseGain = audioContext.createGain();
        suspenseOsc.connect(suspenseGain);
        suspenseGain.connect(audioContext.destination);
        suspenseOsc.type = "sine";
        suspenseOsc.frequency.setValueAtTime(220, audioContext.currentTime);
        suspenseOsc.frequency.linearRampToValueAtTime(250, audioContext.currentTime + 0.5);
        suspenseGain.gain.setValueAtTime(0.05, audioContext.currentTime);
        suspenseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        suspenseOsc.start(audioContext.currentTime);
        suspenseOsc.stop(audioContext.currentTime + 0.6);
        break;
        
      case "other":
        // Soft scribble sound + whisper chime
        // Pencil scribble (rapid filtered noise)
        const scribbleOsc = audioContext.createOscillator();
        const scribbleGain = audioContext.createGain();
        const scribbleFilter = audioContext.createBiquadFilter();
        scribbleOsc.connect(scribbleFilter);
        scribbleFilter.connect(scribbleGain);
        scribbleGain.connect(audioContext.destination);
        scribbleOsc.type = "sawtooth";
        scribbleFilter.type = "highpass";
        scribbleFilter.frequency.setValueAtTime(800, audioContext.currentTime);
        scribbleOsc.frequency.setValueAtTime(150, audioContext.currentTime);
        scribbleOsc.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.3);
        scribbleGain.gain.setValueAtTime(0.03, audioContext.currentTime);
        scribbleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        scribbleOsc.start(audioContext.currentTime);
        scribbleOsc.stop(audioContext.currentTime + 0.3);
        
        // Soft whisper chime
        setTimeout(() => {
          const chimeOsc1 = audioContext.createOscillator();
          const chimeOsc2 = audioContext.createOscillator();
          const chimeGain = audioContext.createGain();
          const chimeFilter = audioContext.createBiquadFilter();
          chimeOsc1.connect(chimeFilter);
          chimeOsc2.connect(chimeFilter);
          chimeFilter.connect(chimeGain);
          chimeGain.connect(audioContext.destination);
          chimeOsc1.type = "sine";
          chimeOsc2.type = "sine";
          chimeFilter.type = "lowpass";
          chimeFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
          chimeOsc1.frequency.setValueAtTime(523, audioContext.currentTime); // C5
          chimeOsc2.frequency.setValueAtTime(659, audioContext.currentTime); // E5
          chimeGain.gain.setValueAtTime(0.04, audioContext.currentTime);
          chimeGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
          chimeOsc1.start(audioContext.currentTime);
          chimeOsc2.start(audioContext.currentTime);
          chimeOsc1.stop(audioContext.currentTime + 0.8);
          chimeOsc2.stop(audioContext.currentTime + 0.8);
        }, 400);
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

export function HomeCategoryAnimation({ isVisible, onComplete, category }: HomeCategoryAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      playCategorySound(category);
      
      // Auto-hide after animation (1.5 seconds for "Other", standard for others)
      const animationDuration = category.toLowerCase() === 'other' ? 1500 : 1500;
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete();
      }, animationDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, category, onComplete]);

  const renderSchoolAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Floating Pencils */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ 
            scale: 0,
            x: (Math.random() - 0.5) * 100,
            y: 50,
            rotate: Math.random() * 360
          }}
          animate={{
            scale: [0, 1, 0],
            y: -100 - Math.random() * 50,
            rotate: Math.random() * 720,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.1,
            ease: "easeOut"
          }}
        >
          <GraduationCap className="h-6 w-6 text-blue-500" />
        </motion.div>
      ))}
      
      {/* Chalk Dust Effect */}
      <motion.div
        className="absolute w-20 h-20 bg-gray-300 rounded-full opacity-20 blur-sm"
        initial={{ scale: 0 }}
        animate={{ 
          scale: [0, 1.5, 0],
          opacity: [0, 0.3, 0]
        }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "backOut" }}
      >
        <span className="text-sm font-medium">🏫 School tea shared!</span>
      </motion.div>
    </div>
  );

  const renderWorkAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Floating Briefcase */}
      <motion.div
        className="text-gray-700"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotate: [0, 5, 0],
          y: [-10, -20, 0]
        }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <Briefcase className="h-12 w-12" />
      </motion.div>
      
      {/* Paper Documents */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-6 bg-white border border-gray-300 rounded-sm shadow-sm"
          initial={{ 
            scale: 0,
            x: Math.cos(i * 90 * Math.PI / 180) * 30,
            y: Math.sin(i * 90 * Math.PI / 180) * 30,
            rotate: 0
          }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos(i * 90 * Math.PI / 180) * 80,
            y: Math.sin(i * 90 * Math.PI / 180) * 80 - 40,
            rotate: Math.random() * 180,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.2,
            delay: 0.2 + i * 0.1,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-gray-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "backOut" }}
      >
        <span className="text-sm font-medium">💼 Work story sent!</span>
      </motion.div>
    </div>
  );

  const renderRelationshipsAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Floating Hearts */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-red-400"
          initial={{ 
            scale: 0,
            x: Math.cos(i * 45 * Math.PI / 180) * 40,
            y: Math.sin(i * 45 * Math.PI / 180) * 40,
          }}
          animate={{
            scale: [0, 1, 0.8, 0],
            x: Math.cos(i * 45 * Math.PI / 180) * 120,
            y: Math.sin(i * 45 * Math.PI / 180) * 120 - 60,
            opacity: [0, 1, 0.8, 0]
          }}
          transition={{
            duration: 1.4,
            delay: i * 0.08,
            ease: "easeOut"
          }}
        >
          <Heart className="h-6 w-6 fill-current" />
        </motion.div>
      ))}
      
      {/* Central Heart Pulse */}
      <motion.div
        className="text-pink-500"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 0.8,
          repeat: 1,
          ease: "easeInOut"
        }}
      >
        <Heart className="h-10 w-10 fill-current" />
      </motion.div>
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "backOut" }}
      >
        <span className="text-sm font-medium">❤️ Love story shared!</span>
      </motion.div>
    </div>
  );

  const renderFamilyAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Cozy Home with Warmth Glow */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.1, 1] }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <Home className="h-12 w-12 text-amber-600" />
        
        {/* Warmth Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-amber-300 rounded-full blur-xl opacity-40"
          animate={{
            scale: [1, 2, 1.5],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 1.5,
            repeat: 1,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* Floating Sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400 text-sm"
          initial={{ 
            scale: 0,
            x: Math.cos(i * 60 * Math.PI / 180) * 50,
            y: Math.sin(i * 60 * Math.PI / 180) * 50,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{
            duration: 1.2,
            delay: 0.3 + i * 0.1,
            ease: "easeOut"
          }}
        >
          ✨
        </motion.div>
      ))}
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "backOut" }}
      >
        <span className="text-sm font-medium">👨‍👩‍👧‍👦 Family story shared!</span>
      </motion.div>
    </div>
  );

  const renderMoneyAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Floating Dollar Signs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-green-500 text-2xl font-bold"
          initial={{ 
            scale: 0,
            x: (Math.random() - 0.5) * 80,
            y: 40,
            rotate: 0
          }}
          animate={{
            scale: [0, 1, 0],
            y: -80 - Math.random() * 40,
            rotate: Math.random() * 180,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.1,
            ease: "easeOut"
          }}
        >
          $
        </motion.div>
      ))}
      
      {/* Central Dollar Icon */}
      <motion.div
        className="text-green-600"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 1.3, 1],
          rotate: [0, 360]
        }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <DollarSign className="h-12 w-12" />
      </motion.div>
      
      {/* Gold Sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          initial={{ 
            scale: 0,
            x: Math.cos(i * 45 * Math.PI / 180) * 60,
            y: Math.sin(i * 45 * Math.PI / 180) * 60,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.8,
            delay: 0.3 + i * 0.05,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "backOut" }}
      >
        <span className="text-sm font-medium">💸 Money talk shared!</span>
      </motion.div>
    </div>
  );

  const renderHotTakesAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Central Flame */}
      <motion.div
        className="text-6xl"
        initial={{ scale: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotateZ: [0, -5, 5, -3, 3, 0]
        }}
        transition={{ 
          duration: 1,
          ease: "easeOut"
        }}
      >
        🔥
      </motion.div>
      
      {/* Sparks */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-orange-400 rounded-full"
          initial={{ 
            scale: 0,
            x: 0,
            y: 0
          }}
          animate={{
            scale: [0, 1, 0],
            x: (Math.random() - 0.5) * 120,
            y: -60 - Math.random() * 60,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1,
            delay: 0.2 + i * 0.05,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Fire Emojis */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-xl"
          initial={{ 
            scale: 0,
            x: Math.cos(i * 90 * Math.PI / 180) * 50,
            y: Math.sin(i * 90 * Math.PI / 180) * 50,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.8,
            delay: 0.4 + i * 0.1,
            ease: "easeOut"
          }}
        >
          🔥
        </motion.div>
      ))}
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "backOut" }}
      >
        <span className="text-sm font-medium">🔥 Hot take dropped!</span>
      </motion.div>
    </div>
  );

  const renderWrongAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Floating Question Marks */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl text-purple-600"
          initial={{ 
            scale: 0,
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            rotate: 0
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.15,
            ease: "easeOut"
          }}
        >
          ❓
        </motion.div>
      ))}
      
      {/* Scale of Justice */}
      <motion.div
        className="text-indigo-600"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotate: [-10, 10, 0]
        }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <Scale className="h-12 w-12" />
      </motion.div>
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7, ease: "backOut" }}
      >
        <span className="text-sm font-medium">🤔 Judgment time!</span>
      </motion.div>
    </div>
  );

  const renderOtherAnimation = () => (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Central Pencil Icon with Scribbling Motion */}
      <motion.div
        className="relative text-6xl"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotate: [0, -15, 15, -10, 10, 0],
          x: [0, -5, 5, -3, 3, 0]
        }}
        transition={{ 
          duration: 0.8, 
          ease: "easeInOut",
          times: [0, 0.2, 0.4, 0.6, 0.8, 1]
        }}
      >
        📝
      </motion.div>
      
      {/* Scribble Trail Effect */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-8 bg-gray-400 rounded-full opacity-60"
          style={{
            transformOrigin: 'bottom center'
          }}
          initial={{ 
            scale: 0,
            rotate: Math.random() * 360,
            x: (Math.random() - 0.5) * 120,
            y: (Math.random() - 0.5) * 80,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0.8, 0],
            opacity: [0, 0.6, 0.4, 0],
            rotate: Math.random() * 180
          }}
          transition={{
            duration: 1.0,
            delay: 0.2 + i * 0.05,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Paper Dust Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-1 h-1 bg-gray-300 rounded-full"
          initial={{ 
            scale: 0,
            x: (Math.random() - 0.5) * 150,
            y: (Math.random() - 0.5) * 100,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 0.7, 0],
            y: Math.random() * -60 - 30,
            x: (Math.random() - 0.5) * 200
          }}
          transition={{
            duration: 1.2,
            delay: 0.4 + Math.random() * 0.6,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Soft Gray Glow */}
      <motion.div
        className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-3xl"
        style={{ width: '200px', height: '200px', margin: 'auto' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.1, 0.05, 0],
          scale: [0, 1, 1.2, 0]
        }}
        transition={{
          duration: 1.3,
          ease: "easeInOut"
        }}
      />
      
      {/* Success Message */}
      <motion.div
        className="absolute bottom-20 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-full shadow-lg"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7, ease: "backOut" }}
      >
        <span className="text-sm font-medium">📝 Writing in the shadows...</span>
      </motion.div>
    </div>
  );

  const getCategoryAnimation = () => {
    switch (category.toLowerCase()) {
      case "school":
        return renderSchoolAnimation();
      case "work":
        return renderWorkAnimation();
      case "relationships":
        return renderRelationshipsAnimation();
      case "family":
        return renderFamilyAnimation();
      case "money":
        return renderMoneyAnimation();
      case "hot-takes":
        return renderHotTakesAnimation();
      case "wrong":
        return renderWrongAnimation();
      case "other":
        return renderOtherAnimation();
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {showAnimation && getCategoryAnimation()}
    </AnimatePresence>
  );
}

// Hook for managing home category animations
export function useHomeCategoryAnimation() {
  const [animation, setAnimation] = useState({
    isVisible: false,
    category: ""
  });

  const triggerAnimation = (category: string) => {
    setAnimation({
      isVisible: true,
      category
    });
  };

  const completeAnimation = () => {
    setAnimation({
      isVisible: false,
      category: ""
    });
  };

  return {
    animation,
    triggerAnimation,
    completeAnimation
  };
}