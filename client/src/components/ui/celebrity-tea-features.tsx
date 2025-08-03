import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Mic, Eye, Star, Flame, Camera } from "lucide-react";
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
}

export function CelebrityTeaFeatures({ onSpillAbout }: CelebrityTeaFeaturesProps) {
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
          <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
            <Star className="h-5 w-5" />
            📊 This Week's Trending Celebs
          </CardTitle>
          <p className="text-sm text-pink-600 dark:text-pink-400">
            The hottest names everyone's talking about
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {trendingCelebs.map((celeb, index) => (
              <div
                key={celeb.name}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                  selectedCeleb === celeb.name 
                    ? "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-900/20" 
                    : "border-gray-200 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-800"
                )}
                onClick={() => setSelectedCeleb(celeb.name)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                      #{index + 1}
                    </span>
                    {celeb.trending && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        📈 TRENDING
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {celeb.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Camera className="h-3 w-3 text-pink-500" />
                        <Eye className="h-3 w-3 text-pink-500" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {celeb.postCount} posts this week
                      </span>
                      <div className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span className="text-xs font-medium">
                          {getDramaMeterText(celeb.dramaMeter)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Drama Meter */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all", getDramaMeterColor(celeb.dramaMeter))}
                        style={{ width: `${celeb.dramaMeter}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{celeb.dramaMeter}%</span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpillAbout(celeb.name);
                    }}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs"
                  >
                    <Mic className="h-3 w-3 mr-1" />
                    Spill Tea
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <Camera className="h-4 w-4" />
          <span className="text-xs font-medium">CANDID MOMENTS</span>
        </div>
      </div>
    </div>
  );
}