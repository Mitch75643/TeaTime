import { useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatarColorOptions } from "@/hooks/use-avatar-color";

interface AvatarColorPickerProps {
  currentColor: string;
  onColorSelect: (color: string) => void;
  className?: string;
}

export function AvatarColorPicker({ 
  currentColor, 
  onColorSelect, 
  className 
}: AvatarColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    onColorSelect(color);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-2", className)}
        >
          <Palette className="h-4 w-4" />
          Edit Avatar Color
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Avatar Color</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 p-4">
          {avatarColorOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleColorSelect(option.value)}
              className={cn(
                "relative w-full h-16 rounded-lg border-2 transition-all hover:scale-105",
                `bg-gradient-to-br ${option.value}`,
                currentColor === option.value 
                  ? "border-white shadow-lg ring-2 ring-orange-400" 
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {currentColor === option.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full p-1">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 left-1 right-1">
                <div className="bg-black/50 text-white text-xs px-1 py-0.5 rounded text-center truncate">
                  {option.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}