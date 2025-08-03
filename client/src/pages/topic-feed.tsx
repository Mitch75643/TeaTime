import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/ui/post-card";
import { SectionPostModal } from "@/components/ui/section-post-modals";
import { CelebrityTeaFeatures } from "@/components/ui/celebrity-tea-features";
import { StoryTimeFeatures } from "@/components/ui/story-time-features";
import { HotTopicsFeatures } from "@/components/ui/hot-topics-features";
import { DailyDebateFeatures } from "@/components/ui/daily-debate-features";
import { TeaExperimentsFeatures } from "@/components/ui/tea-experiments-features";

import { SuggestionsFeatures } from "@/components/ui/suggestions-features";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@shared/schema";

interface TopicInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  textColor: string;
  count: number;
}

const topicConfig: Record<string, TopicInfo> = {
  "celebrity-tea": {
    id: "celebrity-tea",
    name: "Celebrity Tea",
    emoji: "🎤",
    description: "Spill the hottest celebrity gossip and entertainment drama",
    gradient: "bg-gradient-to-br from-pink-500 to-rose-500", // Match Community card - Red
    textColor: "text-white",
    count: 234
  },
  "story-time": {
    id: "story-time", 
    name: "Story Time",
    emoji: "📚",
    description: "Share your wildest, funniest, and most memorable life stories",
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-500", // Match Community card exactly
    textColor: "text-white",
    count: 567
  },
  "hot-topics": {
    id: "hot-topics",
    name: "Hot Topics", 
    emoji: "🔥",
    description: "Discuss trending subjects that everyone's talking about",
    gradient: "bg-gradient-to-br from-red-500 to-orange-500", // Match Community card exactly
    textColor: "text-white",
    count: 189
  },
  "daily-debate": {
    id: "daily-debate",
    name: "Daily Debate",
    emoji: "⚔️", 
    description: "Drop bold opinions and thought-provoking questions",
    gradient: "bg-gradient-to-br from-green-500 to-teal-500", // Match Community card exactly
    textColor: "text-white",
    count: 345
  },
  "tea-experiments": {
    id: "tea-experiments",
    name: "Tea Experiments",
    emoji: "🧪",
    description: "Create polls and let the community decide",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-500", // Match Community card exactly
    textColor: "text-white",
    count: 78
  },

  "suggestions": {
    id: "suggestions",
    name: "Feedback/Suggestions",
    emoji: "💡",
    description: "Ideas and feedback for improving TeaSpill",
    gradient: "bg-gradient-to-br from-cyan-500 to-blue-500", // Match Community card exactly
    textColor: "text-white", 
    count: 56
  }
};

type SortOption = "new" | "trending" | "top" | "most-reacted";

export default function TopicFeed() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("new");
  const [storyCategory, setStoryCategory] = useState("all");

  const [selectedTopic, setSelectedTopic] = useState("");
  
  // Get topic ID from URL params
  const topicId = params.topicId || 'celebrity-tea';
  const topic = topicConfig[topicId];

  // Scroll to top when topic changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [topicId]);

  // Listen for story category changes from post submission
  useEffect(() => {
    const handleStoryCategoryChange = (event: CustomEvent) => {
      if (topicId === "story-time" && event.detail) {
        setStoryCategory(event.detail);
      }
    };

    window.addEventListener('setStoryCategory', handleStoryCategoryChange as EventListener);
    return () => {
      window.removeEventListener('setStoryCategory', handleStoryCategoryChange as EventListener);
    };
  }, [topicId]);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts', topicId, sortBy, storyCategory],
    select: (posts) => {
      // Filter posts by topic and sort them
      let filteredPosts = posts.filter(post => {
        // Match by category or custom fields based on topic
        switch (topicId) {
          case "celebrity-tea":
            return post.category === "gossip" || post.celebrityName;
          case "story-time": 
            const isStoryPost = post.category === "story" || post.storyType;
            if (!isStoryPost) return false;
            // Additional filtering by story category
            if (storyCategory !== "all") {
              return post.storyType === storyCategory;
            }
            return true;
          case "hot-topics":
            return post.topicTitle || post.category === "other";
          case "daily-debate":
            return post.category === "debate";
          case "tea-experiments":
            return post.category === "poll" || post.pollOptions;
          case "suggestions":
            return post.tags?.includes("#suggestions");
          default:
            return false;
        }
      });

      // Sort posts based on selected option
      switch (sortBy) {
        case "trending":
          return filteredPosts.sort((a, b) => {
            const aFireReactions = (a.reactions && typeof a.reactions === 'object' && 'fire' in a.reactions) ? (a.reactions.fire || 0) : 0;
            const bFireReactions = (b.reactions && typeof b.reactions === 'object' && 'fire' in b.reactions) ? (b.reactions.fire || 0) : 0;
            const aScore = (aFireReactions as number) * 2 + Object.values(a.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
            const bScore = (bFireReactions as number) * 2 + Object.values(b.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
            return bScore - aScore;
          });
        case "top":
          return filteredPosts.sort((a, b) => {
            const aTotal = Object.values(a.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
            const bTotal = Object.values(b.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
            return bTotal - aTotal;
          });
        case "most-reacted":
          return filteredPosts.sort((a, b) => {
            const aReactions = Object.values(a.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
            const bReactions = Object.values(b.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
            return bReactions - aReactions;
          });
        case "new":
        default:
          return filteredPosts.sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
          });
      }
    }
  });

  if (!topic) {
    setLocation('/community');
    return null;
  }

  const handleBackClick = () => {
    setLocation('/community');
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "new", label: "New" },
    { value: "trending", label: "Trending" },
    { value: "top", label: "Top" },
    { value: "most-reacted", label: "Most Reacted" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Back Arrow - Always visible in top left with topic theme */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className={cn(
            "shadow-lg border backdrop-blur-sm",
            topic.gradient,
            topic.textColor,
            "hover:opacity-90 transition-opacity"
          )}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Header with topic branding */}
      <div className={cn("relative", topic.gradient)}>
        <div className="px-4 py-6">
          {/* Navigation - Hidden since we have fixed back button */}
          <div className="flex items-center justify-between mb-4">
            <div></div> {/* Spacer */}
          </div>

          {/* Topic Header */}
          <div className="text-center">
            <div className="text-4xl mb-2">{topic.emoji}</div>
            <h1 className={cn("text-2xl font-bold mb-2", topic.textColor)}>
              {topic.name}
            </h1>
            <p className={cn("text-sm opacity-90 mb-4", topic.textColor)}>
              {topic.description}
            </p>
            <div className={cn("text-sm opacity-75", topic.textColor)}>
              {topic.count} posts • {posts.length} showing
            </div>
          </div>
        </div>


      </div>

      {/* Topic-Specific Features */}
      <div className="px-4 pt-8 pb-6 space-y-6 max-w-2xl mx-auto">
        {topicId === "celebrity-tea" && (
          <CelebrityTeaFeatures 
            onSpillAbout={(celebName) => {
              setIsPostModalOpen(true);
            }}
            onCreatePost={() => {
              setIsPostModalOpen(true);
            }}
          />
        )}
        
        {topicId === "story-time" && (
          <StoryTimeFeatures 
            onWriteStory={(prompt, category) => {
              setIsPostModalOpen(true);
            }}
            selectedCategory={storyCategory}
            onCategoryChange={setStoryCategory}
            onCreatePost={() => {
              setIsPostModalOpen(true);
            }}
          />
        )}
        
        {topicId === "hot-topics" && (
          <HotTopicsFeatures 
            onCreateTopic={(topic, hashtag) => {
              setSelectedTopic(topic || "");
              setIsPostModalOpen(true);
            }}
            onCreatePost={() => {
              setSelectedTopic("");
              setIsPostModalOpen(true);
            }}
          />
        )}
        
        {topicId === "daily-debate" && (
          <DailyDebateFeatures 
            onVote={(optionId) => {
              console.log(`Voted ${optionId} on daily debate`);
            }}
            onCreateDebate={(question) => {
              setIsPostModalOpen(true);
            }}
          />
        )}
        
        {topicId === "tea-experiments" && (
          <TeaExperimentsFeatures 
            onCreatePoll={(question, options) => {
              setIsPostModalOpen(true);
            }}
            onVote={(optionId) => {
              console.log(`Voted ${optionId} on experiment`);
            }}
          />
        )}
        

        
        {topicId === "suggestions" && (
          <SuggestionsFeatures 
            onSubmitSuggestion={(suggestion) => {
              console.log('New suggestion:', suggestion);
            }}
            onVote={(suggestionId, voteType) => {
              console.log(`Voted ${voteType} on suggestion ${suggestionId}`);
            }}
          />
        )}
      </div>

      {/* Posts Feed */}
      <div className="container mx-auto px-4 py-6 pb-20">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
              />
            ))}
            
            {/* Celebrity Tea specific Create Post button under posts */}
            {topicId === "celebrity-tea" && posts.length > 0 && (
              <div className="text-center pt-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => setIsPostModalOpen(true)}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white w-full max-w-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Share More Celebrity Tea
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Got more gossip to spill? Keep the conversation going!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {posts.length > 0 && (
        <Button
          onClick={() => setIsPostModalOpen(true)}
          className={cn(
            "fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50",
            topic.gradient,
            "hover:scale-105 transition-transform"
          )}
          size="icon"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Section-specific Post Modal */}
      <SectionPostModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setSelectedTopic("");
        }}
        section={topicId}
        sectionTitle={`${topic.emoji} ${topic.name}`}
        promptText={selectedTopic}
      />
    </div>
  );
}