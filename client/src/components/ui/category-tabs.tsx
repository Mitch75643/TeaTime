import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", label: "All", emoji: "", colorClass: "" },
  { id: "school", label: "School", emoji: "🏫", colorClass: "category-school" },
  { id: "work", label: "Work", emoji: "💼", colorClass: "category-work" },
  { id: "relationships", label: "Relationships", emoji: "💕", colorClass: "category-relationships" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", colorClass: "category-family" },
  { id: "money", label: "Money", emoji: "💸", colorClass: "category-money" },
  { id: "hot-takes", label: "Hot Takes", emoji: "🌍", colorClass: "category-hot-takes" },
  { id: "drama", label: "Am I the Drama?", emoji: "🎭", colorClass: "category-drama" },
];

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
              activeCategory === category.id
                ? category.colorClass || "bg-purple-500 text-white border-purple-500 dark:bg-purple-600"
                : category.id === "all" 
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"
                  : `${category.colorClass} opacity-60 hover:opacity-100`
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.emoji && <span className="mr-1">{category.emoji}</span>}
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
