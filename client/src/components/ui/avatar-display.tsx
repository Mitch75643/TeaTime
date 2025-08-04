import { getAvatarEmoji } from "./avatar-selector";
import { cn } from "@/lib/utils";

interface AvatarDisplayProps {
  avatarId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
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
  showBorder = true 
}: AvatarDisplayProps) {
  const emoji = getAvatarEmoji(avatarId);
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        "bg-gradient-to-br from-purple-100 to-blue-100",
        "dark:from-purple-900/30 dark:to-blue-900/30",
        showBorder && "border-2 border-purple-200 dark:border-purple-700",
        sizeClasses[size],
        className
      )}
    >
      <span className="select-none">{emoji}</span>
    </div>
  );
}