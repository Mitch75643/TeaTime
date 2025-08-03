import { useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { avatars, getAvatarsByCategory, getAvatarById, categoryLabels, type Avatar } from "@/lib/avatars";
import { Palette, Check } from "lucide-react";

interface AvatarSelectorProps {
  currentAvatarId?: string;
  onSelect: (avatarId: string) => void;
  className?: string;
}

export function AvatarSelector({ currentAvatarId, onSelect, className }: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Avatar['category']>('moods');
  const [tempSelectedId, setTempSelectedId] = useState(currentAvatarId || 'happy-face');

  const currentAvatar = getAvatarById(currentAvatarId || 'happy-face');
  const categoryAvatars = getAvatarsByCategory(selectedCategory);

  const handleSave = () => {
    // Save to localStorage and dispatch event for real-time updates
    localStorage.setItem('userAvatarId', tempSelectedId);
    window.dispatchEvent(new CustomEvent('avatarChanged', { 
      detail: { avatarId: tempSelectedId } 
    }));
    
    onSelect(tempSelectedId);
    setIsOpen(false);
  };

  const handleAvatarClick = (avatarId: string) => {
    setTempSelectedId(avatarId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative group overflow-hidden rounded-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-400/30 transition-all duration-200",
            className
          )}
        >
          <div className="w-8 h-8 relative">
            {currentAvatar ? (
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: currentAvatar.svg }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <Palette className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-full flex items-center justify-center">
              <Palette className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Choose Your Profile Pic</DialogTitle>
          <p className="text-sm text-gray-600 text-center">
            Pick an avatar that represents your TeaSpill personality
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-purple-200">
              {tempSelectedId && (
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: getAvatarById(tempSelectedId)?.svg || '' }}
                />
              )}
            </div>
            <p className="text-sm font-medium mt-2">
              {getAvatarById(tempSelectedId)?.name || 'Select an avatar'}
            </p>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Avatar['category'])}>
            <TabsList className="grid w-full grid-cols-2 gap-1">
              <TabsTrigger value="moods" className="text-xs">😊 Moods</TabsTrigger>
              <TabsTrigger value="animals" className="text-xs">🐱 Animals</TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-2 gap-1 mt-1">
              <TabsTrigger value="objects" className="text-xs">☕ Objects</TabsTrigger>
              <TabsTrigger value="characters" className="text-xs">👽 Characters</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <ScrollArea className="h-48">
                <div className="grid grid-cols-4 gap-2 p-2">
                  {categoryAvatars.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleAvatarClick(avatar.id)}
                      className={cn(
                        "relative w-12 h-12 rounded-full border-2 transition-all hover:scale-105",
                        tempSelectedId === avatar.id
                          ? "border-purple-500 ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                      )}
                    >
                      <div 
                        className="w-full h-full rounded-full overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: avatar.svg }}
                      />
                      {tempSelectedId === avatar.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Save Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}