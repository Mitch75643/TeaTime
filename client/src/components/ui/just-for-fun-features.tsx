import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Textarea } from "./textarea";
import { Sparkles, Laugh, MessageCircle, HelpCircle, Image, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const funCategories = [
  { id: "meme", name: "Meme", emoji: "😂", icon: Laugh, description: "Funny observations and jokes" },
  { id: "rant", name: "Rant", emoji: "😤", icon: MessageCircle, description: "Let it all out" },
  { id: "confession", name: "Confession", emoji: "🤫", icon: Sparkles, description: "Secret thoughts and admissions" },
  { id: "question", name: "Question", emoji: "❓", icon: HelpCircle, description: "Random thoughts and wondering" }
];

const preloadedGifs = [
  { id: "happy", name: "Happy Dance", emoji: "💃", url: "/gifs/happy-dance.gif" },
  { id: "shocked", name: "Mind Blown", emoji: "🤯", url: "/gifs/mind-blown.gif" },
  { id: "crying", name: "Crying", emoji: "😭", url: "/gifs/crying.gif" },
  { id: "laughing", name: "LOL", emoji: "🤣", url: "/gifs/laughing.gif" },
  { id: "thumbsup", name: "Thumbs Up", emoji: "👍", url: "/gifs/thumbs-up.gif" },
  { id: "facepalm", name: "Facepalm", emoji: "🤦", url: "/gifs/facepalm.gif" },
  { id: "celebration", name: "Party", emoji: "🎉", url: "/gifs/celebration.gif" },
  { id: "confused", name: "Confused", emoji: "😵", url: "/gifs/confused.gif" }
];

const memeTemplates = [
  "When someone says 'we need to talk'...",
  "Me trying to adult:",
  "My bank account after online shopping:",
  "When the wifi is down:",
  "Me at 3 AM wondering why I...",
  "When someone asks what I did all day:",
  "My life goals vs. my actual life:",
  "When I see my ex doing well:"
];

interface JustForFunFeaturesProps {
  onCreatePost: (content: string, category: string, gif?: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function JustForFunFeatures({ 
  onCreatePost, 
  selectedCategory = "meme",
  onCategoryChange 
}: JustForFunFeaturesProps) {
  const [content, setContent] = useState("");
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const handleSubmit = () => {
    if (content.trim()) {
      onCreatePost(content, selectedCategory, selectedGif || undefined);
      setContent("");
      setSelectedGif(null);
      setShowGifPicker(false);
    }
  };

  const insertTemplate = (template: string) => {
    setContent(template);
  };

  const selectedCategoryData = funCategories.find(cat => cat.id === selectedCategory) || funCategories[0];
  const Icon = selectedCategoryData.icon;

  return (
    <div className="space-y-6">
      {/* Category Selector */}
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <Sparkles className="h-5 w-5" />
            🎉 Pick Your Vibe
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {funCategories.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => onCategoryChange?.(category.id)}
                  className="h-auto p-3 justify-start"
                >
                  <div className="text-left w-full">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{category.emoji}</span>
                      <span>{category.name}</span>
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {category.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Creator */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Icon className="h-5 w-5" />
            {selectedCategoryData.emoji} Create {selectedCategoryData.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Meme Templates (only for meme category) */}
            {selectedCategory === "meme" && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  🎭 Quick Meme Templates:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {memeTemplates.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => insertTemplate(template)}
                      className="h-auto p-2 text-left justify-start text-xs"
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Input */}
            <div>
              <Textarea
                placeholder={
                  selectedCategory === "meme" ? "Drop your funniest observation..." :
                  selectedCategory === "rant" ? "What's bothering you today?" :
                  selectedCategory === "confession" ? "Time to spill your secret..." :
                  "What's on your mind?"
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-32 resize-none text-lg"
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Make it punchy and fun!</span>
                <span className={content.length > 250 ? "text-red-500" : ""}>
                  {content.length}/300
                </span>
              </div>
            </div>

            {/* GIF Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  🎬 Add Reaction GIF:
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGifPicker(!showGifPicker)}
                >
                  <Image className="h-4 w-4 mr-2" />
                  {showGifPicker ? "Hide" : "Show"} GIFs
                </Button>
              </div>
              
              {showGifPicker && (
                <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {preloadedGifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => setSelectedGif(gif.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all hover:scale-105",
                        selectedGif === gif.id 
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" 
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                      )}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{gif.emoji}</div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {gif.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {selectedGif && (
                <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-600 dark:text-purple-400">
                      Selected GIF:
                    </span>
                    <Badge className="bg-purple-100 text-purple-700">
                      {preloadedGifs.find(g => g.id === selectedGif)?.name}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGif(null)}
                      className="ml-auto"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-lg font-medium"
            >
              <Zap className="h-5 w-5 mr-2" />
              Share {selectedCategoryData.name}!
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fun Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">😂</div>
            <div className="text-sm font-medium text-green-700 dark:text-green-300">
              Daily Laughs
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              1,247
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-pink-200 dark:border-pink-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🎉</div>
            <div className="text-sm font-medium text-pink-700 dark:text-pink-300">
              Good Vibes
            </div>
            <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
              892
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}