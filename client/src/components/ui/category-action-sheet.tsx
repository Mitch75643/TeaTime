import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { X } from "lucide-react";

interface CategoryActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: string) => void;
}

const categories = [
  { id: "college", label: "College", emoji: "🎓", description: "Campus life, classes, dorms" },
  { id: "work", label: "Work", emoji: "💼", description: "Office drama, coworkers, bosses" },
  { id: "relationships", label: "Relationships", emoji: "💕", description: "Dating, love, breakups" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦", description: "Parents, siblings, relatives" },
  { id: "money", label: "Money", emoji: "💰", description: "Finances, spending, debt" },
  { id: "politics", label: "Politics", emoji: "🗳️", description: "Current events, opinions" },
  { id: "drama", label: "Am I the Drama?", emoji: "🎭", description: "Let the community judge" },
];

export function CategoryActionSheet({ isOpen, onClose, onCategorySelect }: CategoryActionSheetProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>What kind of tea are you spilling? ☕</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              className="w-full justify-start p-4 h-auto text-left hover:bg-purple-50 dark:hover:bg-purple-900/20"
              onClick={() => onCategorySelect(category.id)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{category.emoji}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {category.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {category.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}