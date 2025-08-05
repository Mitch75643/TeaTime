import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/ui/post-card";
import { SectionPostModal } from "@/components/ui/section-post-modals";
import { CelebrityTeaFeatures } from "@/components/ui/celebrity-tea-features";
import { StoryTimeFeatures } from "@/components/ui/story-time-features";
import { StoryRecommendations } from "@/components/ui/story-recommendations";
import { TrendingStories } from "@/components/ui/trending-stories";
import { HotTopicsFeatures } from "@/components/ui/hot-topics-features";
import { DailyDebateFeatures } from "@/components/ui/daily-debate-features";
import { TeaExperimentsFeatures } from "@/components/ui/tea-experiments-features";
import { useWebSocket } from "@/hooks/useWebSocket";

import { SuggestionsFeatures } from "@/components/ui/suggestions-features";
import { CelebrationAnimation, useCelebration } from "@/components/ui/celebration-animations";
import { ArrowLeft, Plus, RefreshCw, Users, User } from "lucide-react";
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
    gradient: "bg-gradient-to-br from-pink-500 to-rose-500",
    textColor: "text-white",
    count: 234
  },
  "story-time": {
    id: "story-time", 
    name: "Story Time",
    emoji: "📚",
    description: "Share your wildest, funniest, and most memorable life stories",
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-500",
    textColor: "text-white",
    count: 567
  },
  "hot-topics": {
    id: "hot-topics",
    name: "Hot Topics", 
    emoji: "🔥",
    description: "Discuss trending subjects that everyone's talking about",
    gradient: "bg-gradient-to-br from-red-500 to-orange-500",
    textColor: "text-white",
    count: 189
  },
  "daily-debate": {
    id: "daily-debate",
    name: "Daily Debate",
    emoji: "⚔️", 
    description: "Drop bold opinions and thought-provoking questions",
    gradient: "bg-gradient-to-br from-green-500 to-teal-500",
    textColor: "text-white",
    count: 345
  },
  "tea-experiments": {
    id: "tea-experiments",
    name: "Tea Experiments",
    emoji: "🧪",
    description: "Create polls and let the community decide",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-500",
    textColor: "text-white",
    count: 127
  },
  "suggestions": {
    id: "suggestions",
    name: "Suggestions",
    emoji: "💡",
    description: "Share ideas to improve the community experience",
    gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
    textColor: "text-white",
    count: 89
  }
};

type SortOption = "new" | "trending" | "top" | "most-reacted";

export default function TopicFeed() {
  const { topicId } = useParams<{ topicId: string }>();
  const [, setLocation] = useLocation();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("new");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Story Time specific states
  const [storyCategory, setStoryCategory] = useState<string>("all");

  // Hot Topics specific states  
  const [hotTopicFilter, setHotTopicFilter] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Celebrity Tea specific states
  const [prefilledCelebrity, setPrefilledCelebrity] = useState<string>("");

  // Celebration animation state
  const { celebration, triggerCelebration, completeCelebration } = useCelebration();

  const topic = topicConfig[topicId as string];

  // WebSocket connection for real-time updates
  useWebSocket();

  const { data: communityPosts = [], isLoading: isLoadingCommunity } = useQuery<Post[]>({
    queryKey: ['/api/posts', topicId, sortBy, 'community', storyCategory, hotTopicFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        userOnly: 'false',
        postContext: 'community',
        section: topicId || ''
      });
      if (storyCategory !== "all") {
        params.append('storyCategory', storyCategory);
      }
      if (hotTopicFilter !== "all") {
        params.append('hotTopicFilter', hotTopicFilter);
      }
      const response = await fetch(`/api/posts/${topicId}/${sortBy}/all?${params}`);
      if (!response.ok) throw new Error("Failed to fetch community posts");
      return response.json();
    }
  });

  if (!topic) {
    setLocation('/community');
    return null;
  }

  const handleBackClick = () => {
    setLocation('/community');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Fixed Back Arrow */}
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
          <div className="text-center">
            <div className="text-4xl mb-2">{topic.emoji}</div>
            <h1 className={cn("text-2xl font-bold mb-2", topic.textColor)}>
              {topic.name}
            </h1>
            <p className={cn("text-sm opacity-90 mb-4", topic.textColor)}>
              {topic.description}
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className={cn("text-sm opacity-75", topic.textColor)}>
                {topic.count} posts • {communityPosts.length} showing
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  "text-xs p-2 rounded-full border border-white/20 hover:bg-white/10",
                  topic.textColor
                )}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Topic-Specific Features */}
      <div className="px-4 pt-8 pb-6 space-y-6">
        {topicId === "celebrity-tea" && (
          <CelebrityTeaFeatures 
            onSpillAbout={(celebName) => {
              setPrefilledCelebrity(celebName);
              setIsPostModalOpen(true);
            }}
            onCreatePost={() => {
              setPrefilledCelebrity("");
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
            onTakeOnTopic={(topic) => {
              setSelectedTopic(topic);
              setIsPostModalOpen(true);
            }}
            selectedFilter={hotTopicFilter}
            onFilterChange={setHotTopicFilter}
            onCreatePost={() => {
              setIsPostModalOpen(true);
            }}
          />
        )}
        
        {topicId === "daily-debate" && (
          <DailyDebateFeatures 
            onJoinDebate={(question) => {
              setIsPostModalOpen(true);
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
            onCelebrationTrigger={(type) => {
              triggerCelebration(type);
            }}
          />
        )}
      </div>

      {/* Full-Width Posts Feed - No Containers */}
      <div className="pb-20">
        {isLoadingCommunity ? (
          <div className="px-4 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded w-3/4 h-4 mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded w-1/2 h-4"></div>
              </div>
            ))}
          </div>
        ) : communityPosts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-4xl mb-4">{topic.emoji}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {topicId === "hot-topics" && hotTopicFilter !== "all" 
                ? "No takes on this yet"
                : `No posts yet in ${topic.name}`
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {topicId === "hot-topics" && hotTopicFilter !== "all" 
                ? "Be the first to weigh in on this hot topic!"
                : "Be the first to share something in this topic!"
              }
            </p>
            <Button
              onClick={() => {
                if (topicId === "hot-topics" && hotTopicFilter !== "all") {
                  setSelectedTopic(hotTopicFilter);
                }
                setIsPostModalOpen(true);
              }}
              className={cn("shadow-lg", topic.gradient, topic.textColor)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {topicId === "hot-topics" && hotTopicFilter !== "all" 
                ? "+ Respond"
                : "Create First Post"
              }
            </Button>
          </div>
        ) : (
          <div className="px-4 space-y-6">
            {/* Show Story Recommendations first for Story Time */}
            {topicId === "story-time" && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    ✨ Recommended for You
                  </span>
                </div>
                <StoryRecommendations 
                  limit={3}
                  showPreferences={true}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4"
                />
              </div>
            )}
            
            {/* Posts Feed - Direct Layout */}
            {communityPosts.map((post: Post) => (
              <PostCard 
                key={post.id}
                post={post}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
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

      {/* Section-specific Post Modal */}
      <SectionPostModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setSelectedTopic("");
          setPrefilledCelebrity("");
        }}
        section={topicId}
        sectionTitle={`${topic.emoji} ${topic.name}`}
        promptText={selectedTopic}
        prefilledCelebrity={prefilledCelebrity}
        onPostSuccess={(section) => {
          triggerCelebration(section as any);
        }}
      />
      
      {/* Celebration Animation */}
      <CelebrationAnimation
        isVisible={celebration.isVisible}
        onComplete={completeCelebration}
        type={celebration.type}
      />
    </div>
  );
}