import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { TrendingUp, Flame, Hash, Plus, Trophy, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const trendingHashtags = [
  { tag: "#UnpopularOpinion", count: 234, trending: "up" },
  { tag: "#Controversial", count: 189, trending: "up" },
  { tag: "#Real", count: 156, trending: "stable" },
  { tag: "#Bold", count: 143, trending: "up" },
  { tag: "#Spicy", count: 98, trending: "down" },
  { tag: "#Facts", count: 87, trending: "up" },
  { tag: "#NoFilter", count: 76, trending: "stable" },
  { tag: "#TruthBomb", count: 65, trending: "up" }
];

const weeklyHotTopics = [
  { title: "AI will replace most jobs in 5 years", reactions: 342 },
  { title: "Social media is toxic for mental health", reactions: 298 },
  { title: "Climate change isn't being taken seriously", reactions: 276 },
  { title: "Gen Z has it harder than previous generations", reactions: 245 },
  { title: "Remote work is overrated", reactions: 198 }
];

interface HotTopicsFeaturesProps {
  onCreateTopic: (topic?: string, hashtag?: string) => void;
  onCreatePost: () => void;
  selectedTopicFilter?: string;
  onTopicFilterChange?: (filter: string) => void;
}

export function HotTopicsFeatures({ 
  onCreateTopic, 
  onCreatePost, 
  selectedTopicFilter = "all",
  onTopicFilterChange 
}: HotTopicsFeaturesProps) {
  const [newTopicIdea, setNewTopicIdea] = useState("");
  const [submittedIdeas, setSubmittedIdeas] = useState<string[]>([]);

  const submitTopicIdea = () => {
    if (newTopicIdea.trim()) {
      setSubmittedIdeas([...submittedIdeas, newTopicIdea.trim()]);
      setNewTopicIdea("");
    }
  };

  const getTrendingIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "down": return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default: return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Post Button */}
      <div className="text-center">
        <Button
          onClick={onCreatePost}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3"
        >
          + Share Your Take
        </Button>
      </div>

      {/* Compact Leaderboard */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-base">
            <Trophy className="h-4 w-4" />
            🏆 This Week's Hottest
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {weeklyHotTopics.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border transition-all hover:shadow-sm cursor-pointer text-sm",
                  index === 0 && "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20",
                  index === 1 && "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50",
                  index === 2 && "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20"
                )}
                onClick={() => onCreateTopic(item.title)}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
                  index === 0 && "bg-yellow-500 text-white",
                  index === 1 && "bg-gray-400 text-white", 
                  index === 2 && "bg-orange-500 text-white"
                )}>
                  #{index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame className="h-2.5 w-2.5 text-red-500" />
                    <span className="text-xs text-gray-500">
                      {item.reactions} takes
                    </span>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTopic(item.title);
                  }}
                  className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/10 h-7 px-2 text-xs"
                >
                  <Plus className="h-2.5 w-2.5 mr-1" />
                  +
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



    </div>
  );
}