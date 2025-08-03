import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface DailyTeaHighlightProps {
  onCreatePost: () => void;
}

export function DailyTeaHighlight({ onCreatePost }: DailyTeaHighlightProps) {
  const dailyPrompts = [
    "What's the wildest thing that happened at your school/work today?",
    "Who ruined your week and how?",
    "What's a secret you've been dying to tell someone?",
    "What's the most dramatic thing happening in your friend group?",
    "What would you do if money wasn't an issue?",
    "What hot take do you have that would make people mad?",
    "What family drama is currently unfolding?",
    "What relationship advice would you give your past self?"
  ];

  const todayPrompt = dailyPrompts[new Date().getDay()];

  return (
    <div className="daily-tea-card rounded-xl p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">☀️</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Today's Daily Tea</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 leading-relaxed">
            {todayPrompt}
          </p>
          <Button
            onClick={onCreatePost}
            className={cn(
              "bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm",
              "hover:from-purple-600 hover:to-pink-600 transition-all duration-200",
              "shadow-sm hover:shadow-md"
            )}
            size="sm"
          >
            📤 Share Now
          </Button>
        </div>
      </div>
    </div>
  );
}