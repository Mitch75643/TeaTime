import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Mic, Eye, Star, Flame, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CelebData {
  name: string;
  postCount: number;
  dramaMeter: number;
  trending: boolean;
}

const trendingCelebs: CelebData[] = [
  { name: "Taylor Swift", postCount: 28, dramaMeter: 85, trending: true },
  { name: "Ariana Grande", postCount: 22, dramaMeter: 60, trending: true },
  { name: "Kim Kardashian", postCount: 31, dramaMeter: 92, trending: false },
  { name: "Selena Gomez", postCount: 19, dramaMeter: 45, trending: true },
  { name: "Dua Lipa", postCount: 15, dramaMeter: 30, trending: false },
];

interface CelebrityTeaFeaturesProps {
  onSpillAbout: (celebName: string) => void;
  onCreatePost: () => void;
}

export function CelebrityTeaFeatures({ onSpillAbout, onCreatePost }: CelebrityTeaFeaturesProps) {
  const [selectedCeleb, setSelectedCeleb] = useState<string | null>(null);

  const getDramaMeterColor = (level: number) => {
    if (level >= 80) return "bg-red-500";
    if (level >= 60) return "bg-orange-500";
    if (level >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getDramaMeterText = (level: number) => {
    if (level >= 80) return "🔥 ON FIRE";
    if (level >= 60) return "🌶️ SPICY";
    if (level >= 40) return "☕ SIMMERING";
    return "😴 QUIET";
  };

  return (
    <div className="space-y-6">
      {/* Top Celebs List */}
      <Card className="border-pink-200 dark:border-pink-800">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
          <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300 text-base font-medium">
            <Star className="h-4 w-4" />
            This Week's Trending Celebs
          </CardTitle>
          <p className="text-xs text-pink-600 dark:text-pink-400">
            Based on recent posts & reactions
          </p>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {trendingCelebs.slice(0, 5).map((celeb, index) => (
              <div
                key={celeb.name}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg border transition-all hover:shadow-sm cursor-pointer",
                  selectedCeleb === celeb.name 
                    ? "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-900/20" 
                    : "border-gray-200 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-800"
                )}
                onClick={() => {
                  setSelectedCeleb(celeb.name);
                  onSpillAbout(celeb.name);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {celeb.name}
                  </span>
                  {celeb.trending && (
                    <span className="text-xs">⬆️</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", getDramaMeterColor(celeb.dramaMeter))}
                      style={{ width: `${celeb.dramaMeter}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{celeb.dramaMeter}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Post for Celebrity Tea */}
      <div className="text-center">
        <Button
          onClick={onCreatePost}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Click a celebrity name above to auto-fill your post
        </p>
      </div>

      {/* Red Carpet Icons Flair */}
      <div className="flex justify-center gap-4 py-2">
        <div className="flex items-center gap-2 text-pink-500">
          <Mic className="h-4 w-4" />
          <span className="text-xs font-medium">EXCLUSIVE</span>
        </div>
        <div className="flex items-center gap-2 text-rose-500">
          <Eye className="h-4 w-4" />
          <span className="text-xs font-medium">BEHIND SCENES</span>
        </div>
        <div className="flex items-center gap-2 text-red-500">
          <Star className="h-4 w-4" />
          <span className="text-xs font-medium">CANDID MOMENTS</span>
        </div>
      </div>
    </div>
  );
}