import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", label: "All", emoji: "" },
  { id: "school", label: "School", emoji: "🏫" },
  { id: "work", label: "Work", emoji: "💼" },
  { id: "relationships", label: "Relationships", emoji: "💕" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "money", label: "Money", emoji: "💸" },
  { id: "hot-takes", label: "Hot Takes", emoji: "🌍" },
  { id: "drama", label: "Am I the Drama?", emoji: "🎭" },
];

// Category colors for active and inactive states
const categoryStyles = {
  "all": {
    active: "bg-slate-500 text-white dark:bg-slate-600 border-slate-300",
    inactive: "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-slate-200"
  },
  "school": {
    active: "bg-emerald-500 text-white dark:bg-emerald-600 border-emerald-300",
    inactive: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border-emerald-200"
  },
  "work": {
    active: "bg-amber-600 text-white dark:bg-amber-700 border-amber-300",
    inactive: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border-amber-200"
  },
  "relationships": {
    active: "bg-rose-500 text-white dark:bg-rose-600 border-rose-300",
    inactive: "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50 border-rose-200"
  },
  "family": {
    active: "bg-blue-500 text-white dark:bg-blue-600 border-blue-300",
    inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border-blue-200"
  },
  "money": {
    active: "bg-green-600 text-white dark:bg-green-700 border-green-300",
    inactive: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 border-green-200"
  },
  "hot-takes": {
    active: "bg-orange-500 text-white dark:bg-orange-600 border-orange-300",
    inactive: "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 border-orange-200"
  },
  "drama": {
    active: "gradient-drama text-white border-red-300",
    inactive: "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 border-red-200"
  }
};

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="mb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Category filtering coming soon
        </p>
      </div>
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2",
              "opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
            )}
            disabled={true}
          >
            {category.emoji && <span className="mr-1">{category.emoji}</span>}
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
