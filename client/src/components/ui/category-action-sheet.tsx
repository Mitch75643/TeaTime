import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CategoryActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: string) => void;
}

const categories = [
  { id: "school", label: "School", emoji: "🏫", description: "Campus life, classes, dorms" },
  { id: "work", label: "Work", emoji: "💼", description: "Office drama, coworkers, bosses" },
  { id: "relationships", label: "Relationships", emoji: "💕", description: "Dating, love, breakups" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", description: "Parents, siblings, relatives" },
  { id: "money", label: "Money", emoji: "💸", description: "Finances, spending, debt" },
  { id: "hot-takes", label: "Hot Takes", emoji: "🌍", description: "Trending topics, controversial opinions" },
  { id: "drama", label: "Am I in the Wrong?", emoji: "🎭", description: "Let the community judge" },
];

const getCategoryStyles = (categoryId: string) => {
  const styles = {
    "school": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    "work": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    "relationships": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
    "family": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    "money": "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    "hot-takes": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    "drama": "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  };
  return styles[categoryId as keyof typeof styles] || "bg-gray-50 text-gray-700 border-gray-200";
};

export function CategoryActionSheet({ isOpen, onClose, onCategorySelect }: CategoryActionSheetProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto w-[calc(100%-2rem)] max-w-[400px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            What kind of tea are you spilling? ☕
          </DialogTitle>
          <DialogDescription>
            Choose a category that best fits your story
          </DialogDescription>
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
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2",
                  getCategoryStyles(category.id)
                )}>
                  {category.emoji}
                </div>
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