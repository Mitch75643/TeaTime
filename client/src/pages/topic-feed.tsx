import React, { useState, useEffect } from "react";
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
import { useSmartFeed } from "@/hooks/use-smart-feed";
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
    emoji: "📖",
    description: "Share your most dramatic stories and experiences",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
    textColor: "text-white",
    count: 189
  },
  "hot-topics": {
    id: "hot-topics",
    name: "Hot Topics", 
    emoji: "🔥",
    description: "Debate trending topics and controversial takes",
    gradient: "bg-gradient-to-br from-red-500 to-pink-500",
    textColor: "text-white",
    count: 167
  },
  "daily-debate": {
    id: "daily-debate",
    name: "Daily Debate",
    emoji: "⚡",
    description: "Daily questions that spark passionate discussions",
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-500",
    textColor: "text-white",
    count: 312
  },
  "tea-experiments": {
    id: "tea-experiments",
    name: "Tea Experiments",
    emoji: "🧪",
    description: "Create polls and let the community decide",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-500",
    textColor: "text-white",
    count: 78
  },
  "suggestions": {
    id: "suggestions",
    name: "Feedback/Suggestions",
    emoji: "💡",
    description: "Ideas and feedback for improving Tfess",
    gradient: "bg-gradient-to-br from-cyan-500 to-blue-500",
    textColor: "text-white", 
    count: 56
  }
};

type SortOption = "new" | "trending" | "top" | "most-reacted";

export default function TopicFeed() {
  // Always initialize all hooks first - no conditionals
  const params = useParams();
  const [, setLocation] = useLocation();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("new");
  const [storyCategory, setStoryCategory] = useState("all");
  const [hotTopicFilter, setHotTopicFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [activeTab, setActiveTab] = useState<'community' | 'user'>('community');
  const [prefilledCelebrity, setPrefilledCelebrity] = useState("");
  
  // Always call all hooks - regardless of component state
  const { celebration, triggerCelebration, completeCelebration } = useCelebration();
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();

  // Get topic info - always do this
  const topicId = params.topicId || 'celebrity-tea';
  const topic = topicConfig[topicId];

  // Always initialize smart feed
  const smartFeed = useSmartFeed({
    queryKey: ['/api/posts/community', topicId, sortBy, storyCategory, hotTopicFilter],
    apiEndpoint: `/api/posts/${topicId}/${sortBy}/all`,
    postContext: 'community',
  });

  // Always call useQuery hooks
  const { data: communityPosts = [], isLoading: isLoadingCommunity } = useQuery<Post[]>({
    queryKey: ['/api/posts/community', topicId, sortBy, storyCategory, hotTopicFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        postContext: 'community',
        section: topicId
      });
      if (storyCategory !== "all") {
        params.append('storyCategory', storyCategory);
      }
      if (hotTopicFilter !== "all") {
        params.append('hotTopicFilter', hotTopicFilter);
      }
      const response = await fetch(`/api/posts/${topicId}/${sortBy}/all?${params}`);
      if (!response.ok) throw new Error("Failed to fetch community posts");
      const data = await response.json();
      console.log(`[${topicId}] Community posts fetched:`, data.length);
      return data;
    },
    enabled: !!topic // Only execute query if topic exists
  });

  const { data: userPosts = [], isLoading: isLoadingUser } = useQuery<Post[]>({
    queryKey: ['/api/posts/user', topicId, sortBy, storyCategory, hotTopicFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        userOnly: 'true',
        postContext: 'community',
        section: topicId
      });
      if (storyCategory !== "all") {
        params.append('storyCategory', storyCategory);
      }
      if (hotTopicFilter !== "all") {
        params.append('hotTopicFilter', hotTopicFilter);
      }
      const response = await fetch(`/api/posts/${topicId}/${sortBy}/user?${params}`);
      if (!response.ok) throw new Error("Failed to fetch user posts");
      const data = await response.json();
      console.log(`[${topicId}] User posts fetched:`, data.length);
      return data;
    },
    enabled: !!topic // Only execute query if topic exists
  });

  // Always call all useEffect hooks
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [topicId]);

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

  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'comment_added') {
        console.log('Topic Feed: Real-time comment added:', message);
        queryClient.invalidateQueries({ queryKey: ['/api/posts/community', topicId] });
        queryClient.invalidateQueries({ queryKey: ['/api/posts/user', topicId] });
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      }
    });

    return unsubscribe;
  }, [topicId, subscribeToMessages, queryClient]);

  useEffect(() => {
    if (!topic) {
      setLocation('/community');
    }
  }, [topic, setLocation]);

  // Don't render if topic is invalid - but all hooks were called above
  if (!topic) {
    return null;
  }

  const isLoading = isLoadingCommunity || isLoadingUser;

  const handleBackClick = () => {
    setLocation('/community');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/posts/community'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/posts/user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/posts', topicId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/debates'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/polls'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/comments'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/reactions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/posts/daily-debate'] });
      
      await queryClient.refetchQueries({ queryKey: ['/api/posts', topicId, sortBy, 'all'] });
      await queryClient.refetchQueries({ queryKey: ['/api/posts', topicId, sortBy, 'user'] });
      
      console.log(`Topic feed refresh completed for ${topicId}`);
    } catch (error) {
      console.error('Topic feed refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "new", label: "New" },
    { value: "trending", label: "Trending" },
    { value: "top", label: "Top" },
    { value: "most-reacted", label: "Most Reacted" }
  ];

  const renderPostsForActiveTab = () => {
    const posts = activeTab === 'community' ? communityPosts : userPosts;
    
    if (isLoading) {
      return (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted rounded-xl h-32"></div>
          ))}
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{topic.emoji}</div>
          <h3 className="text-lg font-semibold mb-2">
            {activeTab === 'community' ? 'No posts yet' : 'You haven\'t posted here yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {activeTab === 'community' 
              ? `Be the first to share in ${topic.name}!` 
              : `Share your thoughts in ${topic.name}!`
            }
          </p>
          <Button onClick={() => setIsPostModalOpen(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {posts.map((post: Post) => (
          <PostCard 
            key={post.id} 
            post={post}
            onCelebrate={(type) => triggerCelebration(type)}
          />
        ))}
      </div>
    );
  };

  const renderTopicFeatures = () => {
    switch (topicId) {
      case "celebrity-tea":
        return <CelebrityTeaFeatures 
          onPrefilledPost={setPrefilledCelebrity}
          onOpenPostModal={() => setIsPostModalOpen(true)}
        />;
      case "story-time":
        return (
          <>
            <StoryTimeFeatures />
            <StoryRecommendations />
            <TrendingStories />
          </>
        );
      case "hot-topics":
        return <HotTopicsFeatures 
          activeFilter={hotTopicFilter}
          onFilterChange={setHotTopicFilter}
        />;
      case "daily-debate":
        return <DailyDebateFeatures 
          onOpenPostModal={() => setIsPostModalOpen(true)}
        />;
      case "tea-experiments":
        return <TeaExperimentsFeatures />;
      case "suggestions":
        return <SuggestionsFeatures />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={cn("relative overflow-hidden", topic.gradient)}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className={cn("text-white/80 hover:text-white hover:bg-white/20", topic.textColor)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-2xl">{topic.emoji}</div>
            <div>
              <h1 className={cn("text-xl font-bold", topic.textColor)}>{topic.name}</h1>
              <p className={cn("text-sm opacity-90", topic.textColor)}>{topic.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setActiveTab('community')}
                variant={activeTab === 'community' ? "secondary" : "ghost"}
                size="sm"
                className={activeTab === 'community' ? "" : "text-white/80 hover:text-white hover:bg-white/20"}
              >
                <Users className="w-4 h-4 mr-1" />
                Community ({communityPosts.length})
              </Button>
              <Button
                onClick={() => setActiveTab('user')}
                variant={activeTab === 'user' ? "secondary" : "ghost"}
                size="sm"
                className={activeTab === 'user' ? "" : "text-white/80 hover:text-white hover:bg-white/20"}
              >
                <User className="w-4 h-4 mr-1" />
                Your Posts ({userPosts.length})
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/20"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
              <Button
                onClick={() => setIsPostModalOpen(true)}
                variant="secondary"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Topic Features */}
        {renderTopicFeatures()}

        {/* Posts */}
        {renderPostsForActiveTab()}
      </div>

      {/* Post Modal */}
      <SectionPostModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setPrefilledCelebrity("");
        }}
        section={topicId}
        prefilledContent={prefilledCelebrity}
        onSuccess={() => {
          setIsPostModalOpen(false);
          setPrefilledCelebrity("");
          // Trigger celebration for certain categories
          if (topicId === "daily-debate") {
            triggerCelebration("debate");
          } else if (topicId === "story-time") {
            triggerCelebration("story");
          }
          handleRefresh();
        }}
      />

      {/* Celebration Animation */}
      {celebration && (
        <CelebrationAnimation
          type={celebration.type}
          onComplete={completeCelebration}
        />
      )}
    </div>
  );
}