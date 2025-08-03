import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostModal } from "./post-modal";
import { Star, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunitySection {
  id: string;
  name: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tags: { tag: string; count: number }[];
  gradient: string;
  textColor: string;
  buttonText: string;
  postConfig?: {
    category?: string;
    tags?: string[];
    customFields?: {
      label: string;
      placeholder: string;
      type: "short" | "long";
    }[];
  };
}

interface CommunityModalProps {
  section: CommunitySection;
  children: React.ReactNode;
}

export function CommunityModal({ section, children }: CommunityModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handleShareClick = () => {
    setIsOpen(false);
    setIsPostModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md w-full max-h-[90vh] overflow-y-auto p-0 border-0">
          <DialogTitle className="sr-only">
            {section.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {section.description}
          </DialogDescription>
          <div className={cn("relative", section.gradient)}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{section.emoji}</span>
                <h2 className={cn("text-xl font-bold", section.textColor)}>
                  {section.name}
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={cn(
                    "h-8 w-8 rounded-full",
                    section.textColor,
                    isFavorited ? "bg-white/20" : "hover:bg-white/10"
                  )}
                >
                  <Star className={cn("h-4 w-4", isFavorited && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "h-8 w-8 rounded-full hover:bg-white/10 absolute top-4 right-4",
                    section.textColor
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pb-4">
              <p className={cn("text-sm opacity-90", section.textColor)}>
                {section.description}
              </p>
            </div>

            {/* Popular Tags */}
            <div className="px-6 pb-6">
              <h3 className={cn("text-sm font-semibold mb-3", section.textColor)}>
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {section.tags.map(({ tag, count }) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-white/20 text-white border-0 hover:bg-white/30 cursor-pointer"
                  >
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Share Button */}
            <div className="px-6 pb-6">
              <Button
                onClick={handleShareClick}
                className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-sm"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                {section.buttonText}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        defaultCategory={section.postConfig?.category}
        defaultTags={section.postConfig?.tags || []}
        sectionTheme={section.id}
      />
    </>
  );
}