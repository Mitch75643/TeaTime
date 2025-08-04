import { getAvatarEmoji } from "./avatar-selector";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/use-user-profile";

// Generate random gradient colors based on avatarId for consistency (fallback only)
function generateGradientColors(avatarId: string): string {
  const colorPalettes = [
    'from-purple-400 to-pink-400',
    'from-blue-400 to-cyan-400', 
    'from-green-400 to-emerald-400',
    'from-yellow-400 to-orange-400',
    'from-red-400 to-pink-400',
    'from-indigo-400 to-purple-400',
    'from-teal-400 to-green-400',
    'from-orange-400 to-red-400',
    'from-cyan-400 to-blue-400',
    'from-emerald-400 to-teal-400',
    'from-pink-400 to-rose-400',
    'from-amber-400 to-yellow-400'
  ];
  
  // Use avatarId to consistently pick the same color for the same avatar
  const hash = avatarId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorPalettes[hash % colorPalettes.length];
}

interface AvatarDisplayProps {
  avatarId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  gradientColors?: string; // Custom gradient for background
  isCurrentUser?: boolean; // Whether this is the current user's avatar
}

const sizeClasses = {
  xs: 'w-6 h-6 text-sm',
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-lg',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-16 h-16 text-2xl',
};

export function AvatarDisplay({ 
  avatarId, 
  size = 'md', 
  className,
  showBorder = true,
  gradientColors,
  isCurrentUser = false
}: AvatarDisplayProps) {
  const emoji = getAvatarEmoji(avatarId);
  const { profile, getCachedProfile } = useUserProfile();
  
  // Get cached profile data immediately to prevent flashing - try multiple sources
  const cachedProfile = getCachedProfile();
  const userAvatarId = profile?.avatarId || cachedProfile?.avatarId || localStorage.getItem('userAvatarId') || 'mask-anonymous';
  const userAvatarColor = profile?.avatarColor || cachedProfile?.avatarColor || localStorage.getItem('userAvatarColor') || 'gradient-purple-blue';
  
  // Determine if this is the current user's avatar by comparing avatarId
  const isUserAvatar = isCurrentUser || avatarId === userAvatarId;
  
  // Use user's selected color for their own avatar, fallback for others
  const gradient = gradientColors || 
    (isUserAvatar ? userAvatarColor : generateGradientColors(avatarId));
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        `bg-gradient-to-br ${gradient}`,
        showBorder && "border-2 border-white/30 dark:border-white/50",
        sizeClasses[size],
        className
      )}
    >
      <span className="select-none filter drop-shadow-sm">{emoji}</span>
    </div>
  );
}