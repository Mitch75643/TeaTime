import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Input } from "./input";
import { TrendingUp, Flame, Hash, Plus, Trophy, Clock } from "lucide-react";
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
}

export function HotTopicsFeatures({ onCreateTopic, onCreatePost }: HotTopicsFeaturesProps) {
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
    <div className="space-y-6">
      {/* Create Post Button */}
      <div className="text-center">
        <Button
          onClick={onCreatePost}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-full"
        >
          + Create Post
        </Button>
      </div>

      {/* This Week Leaderboard */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <Trophy className="h-5 w-5" />
            🏆 This Week's Hottest Discussions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {weeklyHotTopics.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                  index === 0 && "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20",
                  index === 1 && "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50",
                  index === 2 && "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20",
                  index > 2 && "border-gray-200 dark:border-gray-700"
                )}
                onClick={() => onCreateTopic(item.title)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 && "bg-yellow-500 text-white",
                    index === 1 && "bg-gray-400 text-white", 
                    index === 2 && "bg-orange-500 text-white",
                    index > 2 && "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  )}>
                    #{index + 1}
                  </div>

                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Flame className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-gray-500">
                      {item.reactions} takes this week
                    </span>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onCreateTopic(item.title)}
                  className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Take
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}