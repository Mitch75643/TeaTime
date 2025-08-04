import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { PostCard } from "@/components/ui/post-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SectionPostModal } from "@/components/ui/section-post-modals";
import { CelebrationAnimation, useCelebration } from "@/components/ui/celebration-animations";
import { CommunityTopicAnimation, useCommunityTopicAnimation } from "@/components/ui/community-topic-animations";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, Plus, MessageSquare, User } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"feed" | "your-posts">("feed");
  const { celebration, triggerCelebration, completeCelebration } = useCelebration();
  const { animation: topicAnimation, triggerAnimation: triggerTopicAnimation, completeAnimation: completeTopicAnimation } = useCommunityTopicAnimation();
  
  const topicConfig = topicConfigs[topicId as keyof typeof topicConfigs];
  
  // Redirect to community if invalid topic
  useEffect(() => {
    if (!topicConfig) {
      setLocation('/community');
    }
  }, [topicConfig, setLocation]);

  // Smart feed hook for all posts
  const allPostsFeed = useSmartFeed({
    queryKey: ["/api/posts", topicConfig?.category || topicId, "new", "all"],
    apiEndpoint: "/api/posts",
    queryParams: {
      category: topicConfig?.category || topicId,
      sortBy: "new",
    },
    postContext: topicId,
    batchSize: 25,
    autoRefreshInterval: 25000, // 25 seconds
  });

  // Smart feed hook for user's posts in this topic
  const userPostsFeed = useSmartFeed({
    queryKey: ["/api/posts", topicConfig?.category || topicId, "new", "user"],
    apiEndpoint: `/api/posts/${topicId}/new/user`,
    queryParams: {
      postContext: "community",
      section: topicId,
    },
    postContext: topicId,
    batchSize: 25,
    autoRefreshInterval: 25000, // 25 seconds
  });

  // Use the appropriate feed based on active tab
  const currentFeed = activeTab === "feed" ? allPostsFeed : userPostsFeed;
  
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
  } = currentFeed;

  const handlePostSuccess = (section: string) => {
    // Trigger both celebration and topic animations
    if (topicConfig?.celebrationType) {
      const animationType = topicConfig.celebrationType as any;
      triggerCelebration(animationType);
      triggerTopicAnimation(section as any);
    }
    
    // Refresh both feeds to show new post
    allPostsFeed.refresh();
    userPostsFeed.refresh();
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

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "feed" | "your-posts")}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger value="feed" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Feed</span>
              </TabsTrigger>
              <TabsTrigger value="your-posts" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Your Posts</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Sticky Header */}
      <StickyRefreshHeader
        title={activeTab === "feed" ? `${topicConfig.name} Feed` : `Your ${topicConfig.name} Posts`}
        subtitle={`${posts.length} posts`}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        className="top-28"
      />

      {/* Tab Content */}
      <div className="px-4 md:px-6 lg:px-8 py-4 max-w-screen-sm lg:max-w-2xl mx-auto">
        <Tabs value={activeTab} className="space-y-4">
          <TabsContent value="feed" className="space-y-4 mt-0">
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
          </TabsContent>

          <TabsContent value="your-posts" className="space-y-4 mt-0">
            {isLoading ? (
              <FeedSkeleton count={3} />
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't shared anything in {topicConfig.name.toLowerCase()} yet.
                </p>
                <Button
                  onClick={() => setIsPostModalOpen(true)}
                  className={cn("shadow-lg hover:shadow-xl text-white", topicConfig.gradient)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Share Your First {topicConfig.name.includes('Tea') ? 'Tea' : 'Story'}
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
          </TabsContent>
        </Tabs>
      </div>

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
      
      {/* Community Topic Animation */}
      <CommunityTopicAnimation
        isVisible={topicAnimation.isVisible}
        type={topicAnimation.type}
        onComplete={completeTopicAnimation}
      />
      
      <BottomNav />
    </div>
  );
}