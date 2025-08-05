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
    description: "Ideas and feedback for improving Tfess",
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
  const [hotTopicFilter, setHotTopicFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [activeTab, setActiveTab] = useState<'community' | 'user'>('community');
  const [prefilledCelebrity, setPrefilledCelebrity] = useState("");
  
  // Celebration hook
  const { celebration, triggerCelebration, completeCelebration } = useCelebration();
  
  // Query client and WebSocket for real-time updates
  const queryClient = useQueryClient();
  const { subscribeToMessages } = useWebSocket();
  
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

  // Subscribe to real-time comment updates for topic feeds
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'comment_added') {
        console.log('Topic Feed: Real-time comment added:', message);
        // Invalidate topic-specific queries to refresh comment counts
        queryClient.invalidateQueries({ queryKey: ['/api/posts/community', topicId] });
        queryClient.invalidateQueries({ queryKey: ['/api/posts/user', topicId] });
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      }
    });

    return unsubscribe;
  }, [topicId, subscribeToMessages, queryClient]);

  // Community Feed - All posts from this topic
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
      return response.json();
    }
  });

  // Your Posts - Only posts by current user for this topic
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
      return response.json();
    }
  });

  const isLoading = isLoadingCommunity || isLoadingUser;

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
    await queryClient.invalidateQueries({ queryKey: ['/api/posts/community'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/posts/user'] });
    setIsRefreshing(false);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "new", label: "New" },
    { value: "trending", label: "Trending" },
    { value: "top", label: "Top" },
    { value: "most-reacted", label: "Most Reacted" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 overflow-y-auto">
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
      <div className="px-4 pt-8 pb-6 space-y-6 max-w-2xl mx-auto">
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
            onCreateTopic={(topic, hashtag) => {
              setSelectedTopic(topic || "");
              setIsPostModalOpen(true);
            }}
            onCreatePost={() => {
              setSelectedTopic("");
              setIsPostModalOpen(true);
            }}
            selectedTopicFilter={hotTopicFilter}
            onTopicFilterChange={setHotTopicFilter}
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
            onCelebrationTrigger={(type) => {
              triggerCelebration(type);
            }}
          />
        )}
      </div>

      {/* Posts Section with Tabs */}
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          {/* Main Posts Section */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              {/* Story Category Filter Bar - Only for Story Time */}
              {topicId === "story-time" && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by story type:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={storyCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStoryCategory("all")}
                  className="text-xs"
                >
                  📖 All Stories
                </Button>
                <Button
                  variant={storyCategory === "horror" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStoryCategory("horror")}
                  className="text-xs"
                >
                  😱 Horror
                </Button>
                <Button
                  variant={storyCategory === "funny" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStoryCategory("funny")}
                  className="text-xs"
                >
                  😂 Funny
                </Button>
                <Button
                  variant={storyCategory === "weird" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStoryCategory("weird")}
                  className="text-xs"
                >
                  🤔 Weird
                </Button>
                <Button
                  variant={storyCategory === "romantic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStoryCategory("romantic")}
                  className="text-xs"
                >
                  💕 Romantic
                </Button>
                <Button
                  variant={storyCategory === "embarrassing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStoryCategory("embarrassing")}
                  className="text-xs"
                >
                  😳 Embarrassing
                </Button>
              </div>
            </div>
          )}

              {/* Hot Topics Filter Bar - Only for Hot Topics */}
              {topicId === "hot-topics" && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by hot topic:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={hotTopicFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHotTopicFilter("all")}
                  className="text-xs"
                >
                  🔥 All Takes
                </Button>
                <Button
                  variant={hotTopicFilter === "AI will replace most jobs in 5 years" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHotTopicFilter("AI will replace most jobs in 5 years")}
                  className="text-xs"
                >
                  #1 AI Jobs
                </Button>
                <Button
                  variant={hotTopicFilter === "Social media is toxic for mental health" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHotTopicFilter("Social media is toxic for mental health")}
                  className="text-xs"
                >
                  #2 Social Media
                </Button>
                <Button
                  variant={hotTopicFilter === "Climate change isn't being taken seriously" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHotTopicFilter("Climate change isn't being taken seriously")}
                  className="text-xs"
                >
                  #3 Climate
                </Button>
                <Button
                  variant={hotTopicFilter === "Gen Z has it harder than previous generations" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHotTopicFilter("Gen Z has it harder than previous generations")}
                  className="text-xs"
                >
                  #4 Gen Z
                </Button>
                <Button
                  variant={hotTopicFilter === "Remote work is overrated" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHotTopicFilter("Remote work is overrated")}
                  className="text-xs"
                >
                  #5 Remote Work
                </Button>
              </div>
            </div>
          )}

          {/* Tab Headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('community')}
                  className={cn(
                    "flex-1 px-8 py-5 text-base font-medium transition-all duration-200",
                    "flex items-center justify-center space-x-3",
                    activeTab === 'community'
                      ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-b-3 border-orange-500 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <Users className="h-5 w-5" />
                  <span>Community Feed</span>
                  <span className="ml-2 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-medium">
                    {communityPosts.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('user')}
                  className={cn(
                    "flex-1 px-8 py-5 text-base font-medium transition-all duration-200",
                    "flex items-center justify-center space-x-3",
                    activeTab === 'user'
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-3 border-blue-500 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <User className="h-5 w-5" />
                  <span>Your Posts</span>
                  <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                    {userPosts.length}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Refresh Feed Button */}
            <div className="w-full">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="w-full py-4 rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium text-base transition-all duration-200 shadow-sm"
              >
                <RefreshCw className={`h-5 w-5 mr-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Feed
              </Button>
            </div>

            {/* Posts Content */}
            <div className="w-full">
              <div className="px-2">
                {activeTab === 'community' && (
                  <div className="space-y-6">
                    {isLoadingCommunity ? (
                      <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 animate-pulse">
                            <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : communityPosts.length === 0 ? (
                  <div className="text-center py-12">
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
                      <div className="space-y-6">
                        {/* Smart Feed Notification */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center">
                          <p className="text-blue-700 dark:text-blue-300 font-medium">
                            Smart feed active - posts are distributed fairly for better visibility
                          </p>
                        </div>
                        
                        {/* Show Story Recommendations first for Story Time */}
                    {topicId === "story-time" && (
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
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
                    
                        {/* Regular Community Posts */}
                        {communityPosts.map((post: Post) => (
                          <div key={post.id} className="w-full">
                            <PostCard 
                              post={post} 
                              hideStoryCategory={topicId === "story-time"}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'user' && (
                  <div className="space-y-6">
                    {isLoadingUser ? (
                      <div className="space-y-6">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 animate-pulse">
                            <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                          </div>
                    ))}
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✍️</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {topicId === "hot-topics" && hotTopicFilter !== "all" 
                        ? "You haven't shared your take yet"
                        : "You haven't posted here yet"
                      }
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {topicId === "hot-topics" && hotTopicFilter !== "all" 
                        ? "Share your perspective on this hot topic!"
                        : `Share your thoughts about ${topic.name.toLowerCase()} with the community!`
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
                        : "Create Your First Post"
                      }
                    </Button>
                  </div>
                    ) : (
                      <div className="space-y-6">
                        {userPosts.map((post: Post) => (
                          <div key={post.id} className="w-full">
                            <PostCard 
                              post={post} 
                              hideStoryCategory={topicId === "story-time"}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
          // Trigger celebration for this topic
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