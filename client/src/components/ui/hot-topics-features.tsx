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

const weeklyLeaderboard = [
  { title: "AI will replace most jobs in 5 years", reactions: 342, emoji: "🤖" },
  { title: "Social media is toxic for mental health", reactions: 298, emoji: "📱" },
  { title: "Climate change isn't being taken seriously", reactions: 276, emoji: "🌍" },
  { title: "Gen Z has it harder than previous generations", reactions: 245, emoji: "👶" },
  { title: "Remote work is overrated", reactions: 198, emoji: "💻" }
];

interface HotTopicsFeaturesProps {
  onCreateTopic: (topic?: string, hashtag?: string) => void;
}

export function HotTopicsFeatures({ onCreateTopic }: HotTopicsFeaturesProps) {
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
      {/* Trending Hashtags */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <Hash className="h-5 w-5" />
            🔥 Trending Hashtags
          </CardTitle>
          <p className="text-sm text-red-600 dark:text-red-400">
            What everyone's talking about right now
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trendingHashtags.map((item, index) => (
              <Button
                key={item.tag}
                variant="outline"
                onClick={() => onCreateTopic("", item.tag)}
                className="h-auto p-3 justify-start hover:border-red-300 dark:hover:border-red-700"
              >
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-1 w-full">
                    <span className="font-medium text-sm">{item.tag}</span>
                    {getTrendingIcon(item.trending)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{item.count} posts</span>
                    {index < 3 && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        HOT
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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
            {weeklyLeaderboard.map((item, index) => (
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
                  <span className="text-lg">{item.emoji}</span>
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Flame className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-gray-500">
                      {item.reactions} reactions this week
                    </span>
                  </div>
                </div>
                
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Take
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Topic Ideas */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Plus className="h-5 w-5" />
            💡 Suggest New Hot Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="What topic should everyone be discussing?"
                value={newTopicIdea}
                onChange={(e) => setNewTopicIdea(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && submitTopicIdea()}
              />
              <Button
                onClick={submitTopicIdea}
                disabled={!newTopicIdea.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
            
            {submittedIdeas.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Submitted Ideas:
                </p>
                {submittedIdeas.map((idea, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                  >
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      Submitted
                    </Badge>
                    <span className="text-sm text-purple-600 dark:text-purple-400">
                      {idea}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}