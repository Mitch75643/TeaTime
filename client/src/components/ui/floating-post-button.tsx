import { useState } from "react";
import { Button } from "./button";
import { PostModal } from "./post-modal";
import { CategoryActionSheet } from "./category-action-sheet";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingPostButton() {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setIsActionSheetOpen(false);
    setIsPostModalOpen(true);
  };

  const handleModalClose = () => {
    setIsPostModalOpen(false);
    setSelectedCategory("");
  };

  return (
    <>
      <Button
        onClick={() => setIsActionSheetOpen(true)}
        className={cn(
          "fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50",
          "w-14 h-14 rounded-full shadow-lg",
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
          "hover:scale-105 transition-all duration-200",
          "border-4 border-white dark:border-gray-800"
        )}
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <CategoryActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onCategorySelect={handleCategorySelect}
      />

      <PostModal
        isOpen={isPostModalOpen}
        onClose={handleModalClose}
        defaultCategory={selectedCategory}
      />
    </>
  );
}