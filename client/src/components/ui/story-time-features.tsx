import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { BookOpen, Sparkles, Heart, Skull, Laugh, Frown } from "lucide-react";
import { cn } from "@/lib/utils";

const storyCategories = [
  { id: "horror", name: "Horror", emoji: "👻", icon: Skull, color: "text-red-600" },
  { id: "funny", name: "Funny", emoji: "😂", icon: Laugh, color: "text-yellow-600" },
  { id: "cringe", name: "Cringe", emoji: "😬", icon: Frown, color: "text-orange-600" },
  { id: "sad", name: "Sad", emoji: "😢", icon: Heart, color: "text-blue-600" },
  { id: "feel-good", name: "Feel-Good", emoji: "✨", icon: Sparkles, color: "text-green-600" }
];

const storyPrompts = [
  "That one time I got stuck in...",
  "The most embarrassing thing that happened to me was...",
  "I'll never forget when...",
  "The weirdest person I ever met...",
  "My worst date story involves...",
  "The craziest thing I did in college...",
  "I still can't believe I survived...",
  "The most awkward family dinner was when..."
];

const storyTypeLabels = [
  { id: "real", label: "✨ Real Story", color: "bg-green-100 text-green-700", description: "This actually happened" },
  { id: "fake", label: "🤥 Made Up", color: "bg-orange-100 text-orange-700", description: "Creative fiction" },
  { id: "undisclosed", label: "🤐 You Decide", color: "bg-purple-100 text-purple-700", description: "Real or fake?" }
];

interface StoryTimeFeaturesProps {
  onWriteStory: (prompt?: string, category?: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  onCreatePost: () => void;
}

export function StoryTimeFeatures({ 
  onWriteStory, 
  selectedCategory = "all",
  onCategoryChange,
  onCreatePost
}: StoryTimeFeaturesProps) {
  const [randomPrompt, setRandomPrompt] = useState<string>("");

  const generateRandomPrompt = () => {
    const prompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)];
    setRandomPrompt(prompt);
    return prompt;
  };

  return (
    <div className="space-y-6">
      {/* Create Post Button */}
      <div className="text-center">
        <Button
          onClick={onCreatePost}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-full"
        >
          + Create Post
        </Button>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          🧠 Got a wild, weird, or funny story? We wanna hear it.
        </p>
      </div>

      {/* Category Filters */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <BookOpen className="h-5 w-5" />
            📚 Story Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => onCategoryChange?.("all")}
              className="justify-center h-12 w-12"
            >
              📚
            </Button>
            {storyCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => onCategoryChange?.(category.id)}
                className="justify-center h-12 w-12"
              >
                {category.emoji}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}