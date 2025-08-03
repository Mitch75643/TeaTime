import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { BookOpen, Sparkles, Heart, Skull, Laugh, Frown } from "lucide-react";
import { cn } from "@/lib/utils";

const storyCategories = [
  { id: "horror", name: "Horror", emoji: "😱" },
  { id: "funny", name: "Funny", emoji: "😂" },
  { id: "weird", name: "Weird", emoji: "🤔" },
  { id: "romantic", name: "Romantic", emoji: "💕" },
  { id: "embarrassing", name: "Embarrassing", emoji: "😳" }
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
      <div className="flex justify-center">
        <Button
          onClick={onCreatePost}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          + Create Post
        </Button>
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
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => onCategoryChange?.("all")}
              className="flex items-center gap-2 h-12 px-4"
            >
              🧃 All
            </Button>
            {storyCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => onCategoryChange?.(category.id)}
                className="flex items-center gap-2 h-12 px-4"
              >
                {category.emoji} {category.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}