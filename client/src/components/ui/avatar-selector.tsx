import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

// Comprehensive avatar collection (50+ options)
export const AVATAR_COLLECTION = {
  // Masked Avatars - Mysterious & Anonymous
  masked: [
    { id: 'mask-theatrical', emoji: '🎭', name: 'Theatrical Mask', category: 'Masked' },
    { id: 'mask-anonymous', emoji: '👤', name: 'Anonymous Silhouette', category: 'Masked' },
    { id: 'mask-ninja', emoji: '🥷', name: 'Ninja Mask', category: 'Masked' },
    { id: 'mask-spy', emoji: '🕵️', name: 'Spy Silhouette', category: 'Masked' },
    { id: 'mask-hood', emoji: '🫥', name: 'Hooded Figure', category: 'Masked' },
    { id: 'mask-cyber', emoji: '🤖', name: 'Cyber Mask', category: 'Masked' },
    { id: 'mask-villain', emoji: '🦹', name: 'Villain Mask', category: 'Masked' },
    { id: 'mask-ghost', emoji: '👻', name: 'Ghost Mask', category: 'Masked' },
  ],
  
  // Emotion-Based Masks - Expressive Anonymous Faces
  emotions: [
    { id: 'emotion-neutral', emoji: '😶', name: 'Blank Stare', category: 'Emotions' },
    { id: 'emotion-sly', emoji: '😏', name: 'Sly Grin', category: 'Emotions' },
    { id: 'emotion-thinking', emoji: '🤔', name: 'Deep Thought', category: 'Emotions' },
    { id: 'emotion-shocked', emoji: '😱', name: 'Shocked', category: 'Emotions' },
    { id: 'emotion-confused', emoji: '😵‍💫', name: 'Confused', category: 'Emotions' },
    { id: 'emotion-embarrassed', emoji: '😳', name: 'Embarrassed', category: 'Emotions' },
    { id: 'emotion-crying', emoji: '😭', name: 'Crying Behind Mask', category: 'Emotions' },
    { id: 'emotion-laughing', emoji: '😂', name: 'Laughing', category: 'Emotions' },
    { id: 'emotion-smirk', emoji: '😈', name: 'Mischievous', category: 'Emotions' },
    { id: 'emotion-zen', emoji: '😌', name: 'Zen Calm', category: 'Emotions' },
  ],
  
  // Fun Characters - Cute & Expressive
  characters: [
    { id: 'char-alien', emoji: '👽', name: 'Alien Visitor', category: 'Characters' },
    { id: 'char-skull', emoji: '💀', name: 'Skeleton', category: 'Characters' },
    { id: 'char-devil', emoji: '👺', name: 'Red Mask', category: 'Characters' },
    { id: 'char-goblin', emoji: '👹', name: 'Blue Mask', category: 'Characters' },
    { id: 'char-ogre', emoji: '👿', name: 'Grumpy Face', category: 'Characters' },
    { id: 'char-clown', emoji: '🤡', name: 'Clown Face', category: 'Characters' },
    { id: 'char-imp', emoji: '😈', name: 'Little Devil', category: 'Characters' },
    { id: 'char-zombie', emoji: '🧟', name: 'Zombie', category: 'Characters' },
  ],
  
  // Animal Masks - Cute & Anonymous
  animals: [
    { id: 'animal-cat', emoji: '🐱', name: 'Cat Mask', category: 'Animals' },
    { id: 'animal-dog', emoji: '🐶', name: 'Dog Mask', category: 'Animals' },
    { id: 'animal-fox', emoji: '🦊', name: 'Fox Mask', category: 'Animals' },
    { id: 'animal-bear', emoji: '🐻', name: 'Bear Mask', category: 'Animals' },
    { id: 'animal-panda', emoji: '🐼', name: 'Panda Mask', category: 'Animals' },
    { id: 'animal-wolf', emoji: '🐺', name: 'Wolf Mask', category: 'Animals' },
    { id: 'animal-lion', emoji: '🦁', name: 'Lion Mask', category: 'Animals' },
    { id: 'animal-tiger', emoji: '🐯', name: 'Tiger Mask', category: 'Animals' },
    { id: 'animal-monkey', emoji: '🐵', name: 'Monkey Mask', category: 'Animals' },
    { id: 'animal-owl', emoji: '🦉', name: 'Owl Mask', category: 'Animals' },
  ],
  
  // Abstract & Symbols - Mysterious & Modern
  abstract: [
    { id: 'abstract-circle', emoji: '⚫', name: 'Black Circle', category: 'Abstract' },
    { id: 'abstract-diamond', emoji: '◆', name: 'Diamond Shape', category: 'Abstract' },
    { id: 'abstract-star', emoji: '⭐', name: 'Star', category: 'Abstract' },
    { id: 'abstract-moon', emoji: '🌙', name: 'Crescent Moon', category: 'Abstract' },
    { id: 'abstract-crystal', emoji: '🔮', name: 'Crystal Ball', category: 'Abstract' },
    { id: 'abstract-fire', emoji: '🔥', name: 'Fire Symbol', category: 'Abstract' },
    { id: 'abstract-lightning', emoji: '⚡', name: 'Lightning', category: 'Abstract' },
    { id: 'abstract-eye', emoji: '👁️', name: 'All-Seeing Eye', category: 'Abstract' },
  ],
  

};

// Flatten all avatars into a single array
export const ALL_AVATARS = Object.values(AVATAR_COLLECTION).flat();

// Default avatar for new users
export const DEFAULT_AVATAR = 'mask-anonymous';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onAvatarSelect: (avatarId: string) => void;
}

export function AvatarSelector({ isOpen, onClose, currentAvatar, onAvatarSelect }: AvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tempSelected, setTempSelected] = useState<string>(currentAvatar);

  const categories = ['all', 'masked', 'emotions', 'characters', 'animals', 'abstract'];
  
  const filteredAvatars = selectedCategory === 'all' 
    ? ALL_AVATARS 
    : ALL_AVATARS.filter(avatar => avatar.category.toLowerCase() === selectedCategory);

  const handleSave = () => {
    onAvatarSelect(tempSelected);
    onClose();
  };

  const handleRandomize = () => {
    const randomAvatar = ALL_AVATARS[Math.floor(Math.random() * ALL_AVATARS.length)];
    setTempSelected(randomAvatar.id);
  };

  const getAvatarById = (id: string) => {
    return ALL_AVATARS.find(avatar => avatar.id === id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">
              {getAvatarById(tempSelected)?.emoji || '👤'}
            </span>
            Choose Your Anonymous Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs capitalize"
              >
                {category === 'all' ? 'All Avatars' : category}
              </Button>
            ))}
          </div>

          {/* Random Button */}
          <Button
            onClick={handleRandomize}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Random Avatar
          </Button>

          {/* Avatar Grid */}
          <ScrollArea className="h-64">
            <div className="grid grid-cols-6 gap-3 p-1">
              {filteredAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setTempSelected(avatar.id)}
                  className={cn(
                    "relative aspect-square rounded-lg border-2 transition-all",
                    "hover:scale-105 hover:shadow-md",
                    "flex items-center justify-center text-2xl",
                    tempSelected === avatar.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg"
                      : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                  )}
                  title={avatar.name}
                >
                  <span className="text-2xl">{avatar.emoji}</span>
                  {tempSelected === avatar.id && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Selected Avatar Info */}
          {tempSelected && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getAvatarById(tempSelected)?.emoji}
                </span>
                <div>
                  <p className="font-medium">
                    {getAvatarById(tempSelected)?.name}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {getAvatarById(tempSelected)?.category}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get avatar emoji by ID
export function getAvatarEmoji(avatarId: string): string {
  const avatar = ALL_AVATARS.find(a => a.id === avatarId);
  return avatar?.emoji || '👤';
}

// Helper function to get avatar name by ID
export function getAvatarName(avatarId: string): string {
  const avatar = ALL_AVATARS.find(a => a.id === avatarId);
  return avatar?.name || 'Anonymous';
}

// Function to get a random avatar ID
export function getRandomAvatarId(): string {
  const randomAvatar = ALL_AVATARS[Math.floor(Math.random() * ALL_AVATARS.length)];
  return randomAvatar.id;
}