import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { PostCard } from "@/components/ui/post-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SectionPostModal } from "@/components/ui/section-post-modals";
import { CelebrationAnimation, useCelebration } from "@/components/ui/celebration-animations";
import { useSmartFeed } from "@/hooks/use-smart-feed";
import { 
  NewPostsBanner, 
  StickyRefreshHeader, 
  LoadMoreButton, 
  FeedSkeleton, 
  SmartFeedContainer 
} from "@/components/ui/smart-feed-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@shared/schema";

const topicConfigs = {
  "celebrity-tea": {
    id: "celebrity-tea",
    name: "Celebrity Tea",
    emoji: "🎤",
    description: "Spill the latest celebrity gossip, pop culture moments, and influencer drama",
    gradient: "bg-gradient-to-br from-pink-500 to-rose-500",
    textColor: "text-white",
    category: "celebrity",
    celebrationType: "paparazzi",
    popularTags: [
      { tag: "#Selena", count: 12 },
      { tag: "#Drama", count: 22 },
      { tag: "#Viral", count: 15 },
      { tag: "#Beef", count: 8 }
    ]
  },
  "story-time": {
    id: "story-time",
    name: "Story Time",
    emoji: "📖",
    description: "Share personal or fictional stories with the community",
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-500",
    textColor: "text-white",
    category: "story",
    celebrationType: "story",
    popularTags: [
      { tag: "#Scary", count: 8 },
      { tag: "#Funny", count: 15 },
      { tag: "#Emotional", count: 12 },
      { tag: "#Shocking", count: 6 }
    ]
  },
  "hot-topics": {
    id: "hot-topics",
    name: "Hot Topics",
    emoji: "🔥",
    description: "Fast-moving trends and spicy community discussions",
    gradient: "bg-gradient-to-br from-red-500 to-orange-500",
    textColor: "text-white",
    category: "hot-topic",
    celebrationType: "fire",
    popularTags: [
      { tag: "#Trending", count: 25 },
      { tag: "#Controversial", count: 18 },
      { tag: "#Debate", count: 20 },
      { tag: "#Viral", count: 30 }
    ]
  },
  "daily-debate": {
    id: "daily-debate",
    name: "Daily Debate",
    emoji: "🗳️",
    description: "Join community discussions and share your perspective",
    gradient: "bg-gradient-to-br from-purple-500 to-violet-500",
    textColor: "text-white",
    category: "debate",
    celebrationType: "debate",
    popularTags: [
      { tag: "#Opinion", count: 16 },
      { tag: "#Vote", count: 12 },
      { tag: "#Discussion", count: 22 },
      { tag: "#Perspective", count: 9 }
    ]
  },
  "tea-experiments": {
    id: "tea-experiments",
    name: "Tea Experiments",
    emoji: "🧪",
    description: "Community polls and social experiments",
    gradient: "bg-gradient-to-br from-green-500 to-teal-500",
    textColor: "text-white",
    category: "experiment",
    celebrationType: "experiment",
    popularTags: [
      { tag: "#Poll", count: 14 },
      { tag: "#Experiment", count: 10 },
      { tag: "#Question", count: 18 },
      { tag: "#Research", count: 7 }
    ]
  },
  "suggestions": {
    id: "suggestions",
    name: "Feedback & Suggestions",
    emoji: "💡",
    description: "Share feature ideas and feedback to improve Tfess",
    gradient: "bg-gradient-to-br from-cyan-500 to-blue-500",
    textColor: "text-white",
    category: "suggestion",
    celebrationType: "suggestion",
    popularTags: [
      { tag: "#Feature", count: 9 },
      { tag: "#Feedback", count: 12 },
      { tag: "#Suggestion", count: 15 },
      { tag: "#Improvement", count: 6 }
    ]
  }
};

export default function TopicFeed() {
  const { topicId } = useParams<{ topicId: string }>();
  const [, setLocation] = useLocation();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { celebration, triggerCelebration, completeCelebration } = useCelebration();
  
  const topicConfig = topicConfigs[topicId as keyof typeof topicConfigs];
  
  // Redirect to community if invalid topic
  useEffect(() => {
    if (!topicConfig) {
      setLocation('/community');
    }
  }, [topicConfig, setLocation]);

  // Smart feed hook with batching and auto-refresh
  const smartFeed = useSmartFeed({
    queryKey: ["/api/posts", topicConfig?.category || topicId, "new"],
    apiEndpoint: "/api/posts",
    queryParams: {
      category: topicConfig?.category || topicId,
      sortBy: "new",
    },
    postContext: topicId,
    batchSize: 25,
    autoRefreshInterval: 25000, // 25 seconds
  });

  const {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    newPostsCount,
    showNewPostsBanner,
    loadMore,
    refresh,
    acceptNewPosts,
    dismissNewPosts,
  } = smartFeed;

  const handlePostSuccess = () => {
    // Trigger celebration animation based on topic type
    if (topicConfig?.celebrationType && topicConfig.celebrationType === "paparazzi") {
      triggerCelebration("paparazzi");
    } else if (topicConfig?.celebrationType && topicConfig.celebrationType === "story") {
      triggerCelebration("story");
    } else if (topicConfig?.celebrationType) {
      // Default celebration type
      triggerCelebration("paparazzi");
    }
    
    // Refresh feed to show new post
    refresh();
  };

  if (!topicConfig) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Topic Header */}
      <div className="px-4 pt-4 pb-2">
        <Card className={cn("border-0 text-white overflow-hidden", topicConfig.gradient)}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/community')}
                className="text-white hover:bg-white/20 p-2 h-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-2xl">{topicConfig.emoji}</span>
              <div>
                <h1 className="text-xl font-bold">{topicConfig.name}</h1>
                <p className="text-sm opacity-90">{topicConfig.description}</p>
              </div>
            </div>
            
            {/* Popular Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {topicConfig.popularTags.slice(0, 4).map(({ tag, count }) => (
                <Badge
                  key={tag}
                  className="bg-white/20 text-white border-0 hover:bg-white/30 text-xs"
                >
                  {tag} ({count})
                </Badge>
              ))}
            </div>
            
            {/* Post Button */}
            <Button
              onClick={() => setIsPostModalOpen(true)}
              className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Share Your {topicConfig.name.includes('Tea') ? 'Tea' : 'Story'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* New Posts Banner */}
      <NewPostsBanner
        count={newPostsCount}
        onAccept={acceptNewPosts}
        onDismiss={dismissNewPosts}
        show={showNewPostsBanner}
      />

      {/* Sticky Header */}
      <StickyRefreshHeader
        title={`${topicConfig.name} Feed`}
        subtitle={`${posts.length} posts`}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        className="top-16"
      />

      <SmartFeedContainer>
        {isLoading ? (
          <FeedSkeleton count={5} />
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">{topicConfig.emoji}</span>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No {topicConfig.name.toLowerCase()} yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Be the first to start the conversation!
            </p>
            <Button
              onClick={() => setIsPostModalOpen(true)}
              className={cn("shadow-lg hover:shadow-xl text-white", topicConfig.gradient)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Share Your {topicConfig.name.includes('Tea') ? 'Tea' : 'Story'}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post: Post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <LoadMoreButton
              onLoadMore={loadMore}
              isLoading={isLoadingMore}
              hasMore={hasMore}
            />
          </>
        )}
      </SmartFeedContainer>

      <SectionPostModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        section={topicId}
        sectionTitle={topicConfig.name}
        category={topicConfig.category}
        onPostSuccess={handlePostSuccess}
      />
      
      {/* Celebration Animation */}
      <CelebrationAnimation 
        isVisible={celebration.isVisible}
        type={celebration.type}
        onComplete={completeCelebration}
      />
      
      <BottomNav />
    </div>
  );
}