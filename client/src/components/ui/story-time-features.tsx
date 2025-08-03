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
}

export function StoryTimeFeatures({ 
  onWriteStory, 
  selectedCategory = "all",
  onCategoryChange 
}: StoryTimeFeaturesProps) {
  const [randomPrompt, setRandomPrompt] = useState<string>("");

  const generateRandomPrompt = () => {
    const prompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)];
    setRandomPrompt(prompt);
    return prompt;
  };

  return (
    <div className="space-y-6">
      {/* Category Filters */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <BookOpen className="h-5 w-5" />
            📚 Story Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => onCategoryChange?.("all")}
              className="justify-start h-auto p-3"
            >
              <div className="text-left">
                <div className="font-medium">All Stories</div>
                <div className="text-xs opacity-70">Everything</div>
              </div>
            </Button>
            {storyCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => onCategoryChange?.(category.id)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{category.emoji}</span>
                      <span>{category.name}</span>
                    </div>
                    <div className="text-xs opacity-70">
                      <Icon className="h-3 w-3 inline mr-1" />
                      Stories
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Story Prompts */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-5 w-5" />
            💡 Need Story Inspiration?
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {randomPrompt && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💭</div>
                  <div className="flex-1">
                    <p className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                      Your Random Prompt:
                    </p>
                    <p className="text-purple-600 dark:text-purple-400 text-lg">
                      "{randomPrompt}"
                    </p>
                    <Button
                      onClick={() => onWriteStory(randomPrompt)}
                      className="mt-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      size="sm"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Write This Story
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={generateRandomPrompt}
                variant="outline"
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get Random Prompt
              </Button>
              <Button
                onClick={() => onWriteStory()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Write Original Story
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Story Type Guide */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            🏷️ Story Types Explained
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3">
            {storyTypeLabels.map((type) => (
              <div key={type.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <Badge className={type.color}>
                  {type.label}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {type.description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}