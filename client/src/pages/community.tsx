import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { PostCard } from "@/components/ui/post-card";
import { SectionPostModal } from "@/components/ui/section-post-modals";
import { CommunityModal } from "@/components/ui/community-section-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Star, 
  BookOpen, 
  Flame, 
  Vote, 
  FlaskConical,
  Sparkles,
  Lightbulb,
  Users
} from "lucide-react";
import type { Post } from "@shared/schema";

const communitySections = [
  {
    id: "celebrity",
    name: "Celebrity Tea", 
    emoji: "🎤",
    icon: Star,
    description: "Spill the latest celebrity gossip, pop culture moments, and influencer drama",
    tags: [
      { tag: "#Selena", count: 12 },
      { tag: "#Beef", count: 8 },
      { tag: "#Viral", count: 15 },
      { tag: "#Drama", count: 22 }
    ],
    gradient: "bg-gradient-to-br from-pink-500 to-rose-500",
    textColor: "text-white",
    buttonText: "Share Celebrity Tea",
    postConfig: {
      category: "celebrity",
      tags: ["#celebrity"]
    }
  },
  {
    id: "stories",
    name: "Story Time",
    emoji: "📖", 
    icon: BookOpen,
    description: "Share personal or fictional stories with the community",
    tags: [
      { tag: "#Scary", count: 8 },
      { tag: "#Funny", count: 15 },
      { tag: "#Emotional", count: 12 },
      { tag: "#Shocking", count: 6 }
    ],
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-500",
    textColor: "text-white", 
    buttonText: "Tell Your Story",
    postConfig: {
      category: "story",
      tags: ["#story"]
    }
  },
  {
    id: "hot",
    name: "Hot Topics",
    emoji: "🔥",
    icon: Flame,
    description: "Fast-moving trends and spicy community discussions",
    tags: [
      { tag: "#UnpopularOpinion", count: 18 },
      { tag: "#Bold", count: 9 },
      { tag: "#Controversial", count: 14 },
      { tag: "#Real", count: 22 }
    ],
    gradient: "bg-gradient-to-br from-red-500 to-orange-500",
    textColor: "text-white",
    buttonText: "Start Hot Discussion", 
    postConfig: {
      category: "hot",
      tags: ["#hot", "#spicy"]
    }
  },
  {
    id: "debate",
    name: "Daily Debate", 
    emoji: "🗳️",
    icon: Vote,
    description: "Vote on today's question and share your perspective",
    tags: [
      { tag: "#Poll", count: 16 },
      { tag: "#Vote", count: 24 },
      { tag: "#Opinion", count: 11 },
      { tag: "#Debate", count: 19 }
    ],
    gradient: "bg-gradient-to-br from-green-500 to-teal-500",
    textColor: "text-white",
    buttonText: "Join Today's Debate",
    postConfig: {
      category: "debate", 
      tags: ["#debate", "#poll"]
    }
  },
  {
    id: "experiments", 
    name: "Tea Experiments",
    emoji: "🧪",
    icon: FlaskConical,
    description: "Share a dilemma, let the community choose your fate",
    tags: [
      { tag: "#Help", count: 14 },
      { tag: "#Advice", count: 20 },
      { tag: "#Experiment", count: 7 },
      { tag: "#Choose", count: 13 }
    ],
    gradient: "bg-gradient-to-br from-purple-500 to-violet-500",
    textColor: "text-white",
    buttonText: "Start Experiment",
    postConfig: {
      category: "experiment",
      tags: ["#experiment", "#help"]
    }
  },
  {
    id: "fun",
    name: "Just for Fun",
    emoji: "🎉", 
    icon: Sparkles,
    description: "Memes, jokes, weird thoughts, and random rants",
    tags: [
      { tag: "#Meme", count: 25 },
      { tag: "#Random", count: 18 },
      { tag: "#Funny", count: 31 },
      { tag: "#Relatable", count: 14 }
    ],
    gradient: "bg-gradient-to-br from-yellow-500 to-amber-500",
    textColor: "text-white",
    buttonText: "Post Something Fun",
    postConfig: {
      category: "fun",
      tags: ["#fun", "#random"]
    }
  },
  {
    id: "suggestions",
    name: "Suggest Something",
    emoji: "💡",
    icon: Lightbulb, 
    description: "Share feature ideas and feedback to improve TeaSpill",
    tags: [
      { tag: "#Feature", count: 9 },
      { tag: "#Feedback", count: 12 },
      { tag: "#Suggestion", count: 15 },
      { tag: "#Improvement", count: 6 }
    ],
    gradient: "bg-gradient-to-br from-cyan-500 to-blue-500",
    textColor: "text-white",
    buttonText: "Submit Suggestion",
    postConfig: {
      category: "suggestion",
      tags: ["#suggestion", "#feature"]
    }
  }
];

export default function Community() {
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "community"],
    queryFn: async () => {
      const response = await fetch("/api/posts?sortBy=new&postContext=community");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Community</h1>
        </div>

        {/* Community Sections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {communitySections.map((section) => {
            const Icon = section.icon;
            return (
              <CommunityModal key={section.id} section={section}>
                <Card className={cn("cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden border-0", section.gradient)}>
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{section.emoji}</span>
                      <h3 className={cn("font-bold text-lg", section.textColor)}>
                        {section.name}
                      </h3>
                    </div>
                    <p className={cn("text-sm mb-4 opacity-90", section.textColor)}>
                      {section.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {section.tags.slice(0, 2).map(({ tag, count }) => (
                        <Badge
                          key={tag}
                          className="bg-white/20 text-white border-0 hover:bg-white/30 text-xs"
                        >
                          {tag} ({count})
                        </Badge>
                      ))}
                      {section.tags.length > 2 && (
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          +{section.tags.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </CommunityModal>
            );
          })}
        </div>

        {/* Recent Community Posts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Community Posts
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No community posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Be the first to start a conversation in one of our themed sections!
              </p>
            </div>
          ) : (
            posts.slice(0, 5).map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>

      <div className="pb-20"></div>
      
      <BottomNav />
    </div>
  );
}