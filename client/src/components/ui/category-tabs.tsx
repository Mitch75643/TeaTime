import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", label: "All", emoji: "✨", gradient: "gradient-soft" },
  { id: "college", label: "College", emoji: "🎓", gradient: "gradient-secondary" },
  { id: "work", label: "Work", emoji: "💼", gradient: "gradient-primary" },
  { id: "relationships", label: "Love", emoji: "💕", gradient: "gradient-drama" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦", gradient: "gradient-soft" },
  { id: "money", label: "Money", emoji: "💰", gradient: "gradient-secondary" },
  { id: "politics", label: "Politics", emoji: "🗳️", gradient: "gradient-primary" },
  { id: "drama", label: "Am I the Drama?", emoji: "🎭", gradient: "gradient-drama" },
];

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="glass px-6 py-4 border-b border-pink-100/50 animate-fade-in">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            className={cn(
              "flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 border-2 border-transparent button-hover-lift whitespace-nowrap",
              activeCategory === category.id
                ? `${category.gradient} text-white shadow-lg transform scale-105 border-white/20`
                : "bg-white/60 text-gray-700 hover:bg-white/80 hover:shadow-md border-pink-100/30"
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            <span className="emoji-lg mr-2">{category.emoji}</span>
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
