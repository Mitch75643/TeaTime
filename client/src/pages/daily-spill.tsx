import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { PostCard } from "@/components/ui/post-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SectionPostModal } from "@/components/ui/section-post-modals";
import { WeeklyThemeAnimation, useWeeklyThemeAnimation } from "@/components/ui/weekly-theme-animations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coffee, Plus, Users, MessageCircle, Star, Crown, Flame, Heart, Zap, Trophy, RefreshCw } from "lucide-react";
import { SmartFeedBanner } from "@/components/ui/smart-feed-banner";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { NotificationLink } from "@/components/ui/notification-link";
import { useSmartFeed } from "@/hooks/use-smart-feed";
import { cn } from "@/lib/utils";
import type { Post } from "@shared/schema";

// Enhanced weekly theme configuration with proper color mappings
const WEEKLY_THEMES_CONFIG = {
  "Love Week": { 
    emoji: "💖", 
    color: "from-pink-500 to-rose-500",
    textColor: "text-pink-100",
    borderColor: "border-pink-300",
    bgColor: "bg-pink-50",
    darkBgColor: "dark:bg-pink-900/20",
    description: "Share your romantic wins, fails, and everything in between",
    animation: "hearts"
  },
  "Drama Week": { 
    emoji: "🎭", 
    color: "from-red-600 to-red-800",
    textColor: "text-red-100",
    borderColor: "border-red-300",
    bgColor: "bg-red-50",
    darkBgColor: "dark:bg-red-900/20",
    description: "Share the juiciest drama and messy situations",
    animation: "spotlight"
  },
  "Mystery Week": { 
    emoji: "🔍", 
    color: "from-gray-700 to-slate-800",
    textColor: "text-gray-100",
    borderColor: "border-gray-400",
    bgColor: "bg-gray-50",
    darkBgColor: "dark:bg-gray-900/20",
    description: "Uncover secrets and mysterious happenings",
    animation: "smoke"
  },
  "Fun Week": { 
    emoji: "🎉", 
    color: "from-yellow-400 to-yellow-600",
    textColor: "text-yellow-900",
    borderColor: "border-yellow-300",
    bgColor: "bg-yellow-50",
    darkBgColor: "dark:bg-yellow-900/20",
    description: "Share your most entertaining and funny moments",
    animation: "confetti"
  },
  "Rant Week": { 
    emoji: "😡", 
    color: "from-red-600 to-red-700",
    textColor: "text-red-100",
    borderColor: "border-red-300",
    bgColor: "bg-red-50",
    darkBgColor: "dark:bg-red-900/20",
    description: "Let it all out - what's been bothering you lately?",
    animation: "lightning"
  },
  "Roast Week": { 
    emoji: "😂", 
    color: "from-orange-500 to-yellow-500",
    textColor: "text-orange-100",
    borderColor: "border-orange-300",
    bgColor: "bg-orange-50",
    darkBgColor: "dark:bg-orange-900/20",
    description: "Time to spill the tea and serve some friendly roasts",
    animation: "tea_splash"
  },
  "Unpopular Opinions": { 
    emoji: "🤯", 
    color: "from-purple-600 to-violet-600",
    textColor: "text-purple-100",
    borderColor: "border-purple-300",
    bgColor: "bg-purple-50",
    darkBgColor: "dark:bg-purple-900/20",
    description: "Share those thoughts everyone disagrees with",
    animation: "bubble_pop"
  },
  "Chaos Week": { 
    emoji: "🌪️", 
    color: "from-green-500 to-teal-500",
    textColor: "text-green-100",
    borderColor: "border-green-300",
    bgColor: "bg-green-50",
    darkBgColor: "dark:bg-green-900/20",
    description: "When life gets messy - share your chaotic moments",
    animation: "chaos_swirl"
  },
  "Money Week": { 
    emoji: "💰", 
    color: "from-green-600 to-emerald-600",
    textColor: "text-green-100",
    borderColor: "border-green-300",
    bgColor: "bg-green-50",
    darkBgColor: "dark:bg-green-900/20",
    description: "Spill the tea about money, work, and financial drama",
    animation: "money_rain"
  },
  "Self-Care Week": { 
    emoji: "🧘‍♀️", 
    color: "from-blue-400 to-cyan-400",
    textColor: "text-blue-100",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50",
    darkBgColor: "dark:bg-blue-900/20",
    description: "Focus on wellness, mental health, and taking care of yourself",
    animation: "zen_ripples"
  }
};

const THEMED_PROMPTS: Record<string, string[]> = {
  "Love Week": [
    "What's the most romantic thing someone has done for you?",
    "Share your biggest dating red flag story",
    "Tell us about a crush that went completely wrong",
    "What's your most embarrassing love confession?",
  ],
  "Rant Week": [
    "What's something that everyone loves but you can't stand?",
    "Vent about the most annoying thing that happened today",
    "What's a trend that needs to die immediately?",
    "Share your biggest pet peeve that no one understands",
  ],
  "Roast Week": [
    "What's the funniest comeback you've ever heard?",
    "Share a time when someone got roasted so hard it was legendary",
    "What's the most savage thing you've witnessed?",
    "Tell us about a roast that went too far",
  ],
  "Unpopular Opinions": [
    "What's an unpopular opinion you'll defend to the death?",
    "Share a belief that makes people think you're crazy",
    "What's something popular that you think is overrated?",
    "Defend something everyone hates but you secretly love",
  ],
  "Chaos Week": [
    "What's the most chaotic thing that happened to you this week?",
    "Share a moment when everything went wrong at once",
    "Tell us about a time you caused complete chaos by accident",
    "What's your most 'main character energy' moment?",
  ],
  "Money Week": [
    "What's the most expensive mistake you've ever made?",
    "Share a time when money caused drama in your life",
    "What's the cheapest thing you've ever done to save money?",
    "Tell us about a financial decision you regret",
  ],
  "Drama Week": [
    "What's the messiest drama you've ever witnessed?",
    "Share a time when you accidentally started drama",
    "What's the pettiest thing you've ever done?",
    "Tell us about drama that was totally worth it",
  ],
  "Self-Care Week": [
    "What's the best self-care advice you've ever received?",
    "Share a mental health breakthrough you've had",
    "What's something you do for yourself that others don't understand?",
    "Tell us about a time you chose yourself first",
  ]
};

const DAILY_PROMPTS = [
  "What's the wildest thing you saw this week?",
  "Tell us about a moment that made you question everything",
  "What's the most embarrassing thing that happened to you recently?",
  "Share something that made you laugh until you cried",
  "What's a secret you've been dying to tell someone?",
  "Describe the most awkward encounter you had this month",
  "What's something you did that you're secretly proud of?",
];

// Hook to get current weekly theme from server
function useCurrentWeeklyTheme() {
  const { data: themeData } = useQuery({
    queryKey: ["/api/rotation/current"],
    queryFn: async () => {
      const response = await fetch("/api/rotation/current");
      if (!response.ok) throw new Error("Failed to fetch current theme");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Find the active weekly theme from rotation data
  const activeTheme = themeData?.weeklyThemes?.find((theme: any) => theme.isActive);
  
  // Get theme configuration or fallback to Drama Week
  const themeName = activeTheme?.name || "Drama Week";
  const themeConfig = WEEKLY_THEMES_CONFIG[themeName as keyof typeof WEEKLY_THEMES_CONFIG] || WEEKLY_THEMES_CONFIG["Drama Week"];
  
  return {
    name: themeName,
    emoji: themeConfig.emoji,
    color: themeConfig.color,
    textColor: themeConfig.textColor,
    borderColor: themeConfig.borderColor,
    bgColor: themeConfig.bgColor,
    darkBgColor: themeConfig.darkBgColor,
    description: themeConfig.description,
    animation: themeConfig.animation
  };
}

// Hook to get current daily prompt from server
function useCurrentDailyPrompt(themeName: string) {
  const { data: rotationData } = useQuery({
    queryKey: ["/api/rotation/current"],
    queryFn: async () => {
      const response = await fetch("/api/rotation/current");
      if (!response.ok) throw new Error("Failed to fetch current content");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get current daily prompt from rotation service or fallback to themed prompts
  const serverPrompt = rotationData?.dailyPrompts?.find((prompt: any) => prompt.isActive)?.content;
  
  if (serverPrompt) {
    return serverPrompt;
  }

  // Fallback to themed prompts
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const themedPrompts = THEMED_PROMPTS[themeName];
  
  if (themedPrompts) {
    return themedPrompts[dayOfYear % themedPrompts.length];
  }
  
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

function getDateString() {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeDiff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-sm font-medium opacity-90">
      ⏳ New prompt in: {timeLeft}
    </span>
  );
}

function SpillStreak() {
  const [streak, setStreak] = useState(3); // This would come from user data in real app
  
  const getStreakMessage = (days: number) => {
    if (days === 0) return "Start your spill streak today!";
    if (days < 3) return `${days}-day streak! Keep going!`;
    if (days < 7) return `${days}-day streak! You're on fire! 🔥`;
    if (days < 14) return `${days}-day streak! Legendary spiller! 👑`;
    return (
      <span className="flex items-center gap-1">
        {days}-day streak! Tea master! 
        <span className="inline-block" style={{ fontSize: '0.875rem', lineHeight: '1', fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"' }}>☕</span>
        👑
      </span>
    );
  };

  const getStreakIcon = (days: number) => {
    if (days < 3) return <Star className="h-3 w-3" />;
    if (days < 7) return <Flame className="h-3 w-3" />;
    if (days < 14) return <Crown className="h-3 w-3" />;
    return <Trophy className="h-3 w-3" />;
  };

  return (
    <div className="flex items-center space-x-2 bg-white/10 rounded-md px-2 py-1">
      <div className="text-white">
        {getStreakIcon(streak)}
      </div>
      <span className="text-xs font-medium text-white">
        {getStreakMessage(streak)}
      </span>
    </div>
  );
}

function SpillProgress({ totalSpills }: { totalSpills: number }) {
  const dailyGoal = 50; // Could be dynamic
  const progress = Math.min((totalSpills / dailyGoal) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Daily Spill Goal</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {totalSpills}/{dailyGoal} spills
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      {progress >= 100 && (
        <div className="text-center">
          <Badge className="bg-green-100 text-green-700 border-green-200">
            🎉 Daily goal reached! Amazing community!
          </Badge>
        </div>
      )}
    </div>
  );
}

export default function DailySpill() {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [hasSpilledToday, setHasSpilledToday] = useState(false); // Would track user's daily participation
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const queryClient = useQueryClient();
  const dateString = getDateString();
  const currentTheme = useCurrentWeeklyTheme();
  const todayPrompt = useCurrentDailyPrompt(currentTheme.name);
  
  // Weekly theme animation hook
  const { animation, triggerAnimation, completeAnimation } = useWeeklyThemeAnimation();

  // Initialize smart feed for daily spills
  const smartFeed = useSmartFeed({
    queryKey: ["/api/posts", "daily", "new"],
    apiEndpoint: "/api/posts",
    category: "daily",
    sortBy: "new",
    postContext: "daily",
  });

  // Get posts with daily spill category and context
  const { data: allPosts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "daily", "new"],
    queryFn: async () => {
      const response = await fetch("/api/posts?category=daily&sortBy=new&postContext=daily");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  // Apply smart feed batching
  const { posts, hasMorePosts } = smartFeed.applyBatching(allPosts);

  // Handle post submission success
  const handlePostSuccess = () => {
    setHasSpilledToday(true);
    setShowSuccessMessage(true);
    
    // Trigger weekly theme animation
    triggerAnimation(currentTheme.animation);
    
    // Refresh the posts feed to show new post immediately
    queryClient.invalidateQueries({ queryKey: ["/api/posts", "daily", "new"] });
    
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Get "Spill of the Day" - highest reacted post
  const spillOfTheDay = posts.length > 0 
    ? posts.reduce((best, current) => {
        const currentReactions = Object.values(current.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
        const bestReactions = Object.values(best.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
        return currentReactions > bestReactions ? current : best;
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Theme of the Week Banner with Streak */}
      <div className="px-4 pt-4">
        <Card className={cn("border-0 text-white bg-gradient-to-r", currentTheme.color)}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{currentTheme.emoji}</span>
                <div>
                  <p className="font-bold text-sm">{currentTheme.name}</p>
                  <p className="text-xs opacity-90">{currentTheme.description}</p>
                </div>
              </div>

            </div>
            {/* Streak Badge attached to theme banner */}
            <div className="mt-2 pt-2 border-t border-white/20">
              <SpillStreak />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="px-4 pt-2">
          <Card className="bg-green-100 border-green-200 text-green-800">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Amazing! Your spill has been added to today's collection! 🎉
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Prompt Card */}
      <div className="px-4 pt-4 pb-4">
        <Card className={cn("text-white border-0 relative overflow-hidden bg-gradient-to-br", currentTheme.color)}>
          {spillOfTheDay && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-yellow-400 text-yellow-900 border-0 text-xs font-bold">
                ⭐ Spill of the Day
              </Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2 mb-2">
              <CountdownTimer />
            </div>
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <span className="flex items-center gap-2">
                <span className="inline-block" style={{ fontSize: '1.25rem', lineHeight: '1', fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"' }}>☕</span>
                Daily Spill
              </span>
              {spillOfTheDay && (
                <div className="text-sm bg-white/20 rounded-full px-2 py-1">
                  🏆 Featured
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-lg font-medium mb-4 leading-relaxed">
              "{todayPrompt}"
            </p>
            <Button
              onClick={() => setIsPostModalOpen(true)}
              className={cn("w-full font-semibold shadow-sm mb-3 text-gray-900 bg-white/90 hover:bg-white")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Spill Your Tea
            </Button>
            <div className="text-center">
              <NotificationLink />
            </div>
          </CardContent>
        </Card>
      </div>





      {/* Spill of the Day Highlight */}
      {spillOfTheDay && (
        <div className="px-4 pb-4">
          <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg text-yellow-700 dark:text-yellow-300">
                  ⭐ Spill of the Day
                </CardTitle>
                <Badge className="bg-yellow-400 text-yellow-900 text-xs">
                  Most Reactions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <PostCard post={spillOfTheDay} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Posts Banner */}
      {smartFeed.showNewPostsBanner && (
        <SmartFeedBanner
          newPostsCount={smartFeed.newPostsCount}
          onLoadNewPosts={smartFeed.handleLoadNewPosts}
        />
      )}

      {/* Sticky Feed Header */}
      <div className="sticky top-16 z-30 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Today's Spills ({allPosts.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={smartFeed.handleRefresh}
              disabled={smartFeed.isRefreshing}
              className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${smartFeed.isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <main className="px-4 pb-20 space-y-4 pt-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading today's spills...</p>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-12">
            <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tea spilled yet today
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Be the first to respond to today's prompt!
            </p>
            <Button
              onClick={() => setIsPostModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Share Your Story
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post: Post) => (
            <PostCard 
              key={post.id} 
              post={post} 
            />
          ))}
          
          {/* Load More Button */}
          {hasMorePosts && (
            <LoadMoreButton
              onLoadMore={smartFeed.handleLoadMore}
              remainingCount={allPosts.length - posts.length}
            />
          )}
        </div>
      </main>

      <SectionPostModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        section="daily-tea"
        sectionTitle="Daily Spill"
        category="daily"
        promptText={todayPrompt}
        onPostSuccess={handlePostSuccess}
      />
      
      {/* Weekly Theme Animation */}
      <WeeklyThemeAnimation 
        isVisible={animation.isVisible}
        theme={animation.theme}
        onComplete={completeAnimation}
      />
      
      <BottomNav />
    </div>
  );
}