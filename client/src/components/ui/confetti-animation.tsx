import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function ConfettiAnimation({ trigger, onComplete }: ConfettiAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; emoji: string }>>([]);

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      
      // Generate confetti pieces
      const pieces = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        emoji: ['🎉', '✨', '👑', '💫', '🔥', '⭐'][Math.floor(Math.random() * 6)]
      }));
      
      setConfetti(pieces);
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className={cn(
            "absolute text-2xl animate-bounce",
            "animate-pulse duration-3000"
          )}
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            animationDelay: `${piece.delay}s`,
            animationDuration: '3s',
            transform: 'translateY(100vh) rotate(720deg)',
          }}
        >
          {piece.emoji}
        </div>
      ))}
      
      {/* Central celebration text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
          <span className="text-lg font-bold">🎉 ICONIC BEHAVIOR! 🎉</span>
        </div>
      </div>
    </div>
  );
}