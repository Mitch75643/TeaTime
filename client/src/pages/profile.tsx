import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { PostCard } from "@/components/ui/post-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/ui/theme-provider";
import { 
  User, 
  Sun, 
  Moon, 
  Bell, 
  Shield, 
  HelpCircle, 
  Info,
  Settings,
  Trash2,
  Download,
  FileText,
  Calendar,
  Heart,
  MessageCircle,
  ExternalLink,
  Home,
  Coffee,
  Star,
  Flame,
  Zap,
  FlaskConical,
  Fingerprint,
  RotateCw,
  Key,
  Check,
  ChevronRight,
  BarChart3,
  Eye,
  Edit,
  Pencil,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { AvatarSelector } from "@/components/ui/avatar-selector";
import { parseDeepLinkParams, clearDeepLinkParams, useDeepLinkNavigation } from "@/lib/deepLinkNavigation";
import { AvatarColorPicker } from "@/components/ui/avatar-color-picker";
import { useUserProfile } from "@/hooks/use-user-profile";
import { AliasSelector } from "@/components/ui/alias-selector";
import { useLocation } from "wouter";
import type { Post } from "@shared/schema";
import { useAnonymousAuth } from "@/lib/anonymousAuth";
import { checkBiometricSupport, isBiometricEnabled } from "@/lib/biometricAuth";
import { SyncSetup } from "@/components/auth/SyncSetup";
import { BiometricSetup } from "@/components/auth/BiometricSetup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BanTestingPanel } from "@/components/admin/ban-testing-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "settings">("posts");
  const [adminPasswordOpen, setAdminPasswordOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  
  // Help & Support modals
  const [helpModalOpen, setHelpModalOpen] = useState("");
  const [reportForm, setReportForm] = useState({
    issue: "",
    description: "",
    includeUsername: false
  });

  const handleReportSubmit = async () => {
    if (!reportForm.description.trim()) {
      toast({
        title: "Please describe the issue",
        description: "We need more details to help you.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/support/report", {
        issue: reportForm.issue || "General Issue",
        description: reportForm.description,
        includeUsername: reportForm.includeUsername,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Report submitted",
        description: "Thank you for your feedback! We'll look into it.",
      });

      setReportForm({ issue: "", description: "", includeUsername: false });
      setHelpModalOpen("");
    } catch (error) {
      toast({
        title: "Failed to submit report",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };
  const { profile, getCachedProfile, updateProfile } = useUserProfile();
  
  // Use cached profile data to prevent flashing - try multiple sources immediately
  const cachedProfile = getCachedProfile();
  const userAvatarId = profile?.avatarId || cachedProfile?.avatarId || localStorage.getItem('userAvatarId') || 'mask-anonymous';
  const storedAlias = localStorage.getItem('userUsername');
  const userAlias = profile?.alias || cachedProfile?.alias || (storedAlias ? JSON.parse(storedAlias).alias : 'Anonymous');
  const avatarColor = profile?.avatarColor || cachedProfile?.avatarColor || localStorage.getItem('userAvatarColor') || 'gradient-purple-blue';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { handleNotificationClick } = useDeepLinkNavigation();
  
  // Deep link navigation state
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Authentication states
  const { user, isUpgraded, clearUserData } = useAnonymousAuth();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [biometricDialogOpen, setBiometricDialogOpen] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);

  useEffect(() => {
    checkBiometricSupport().then(setBiometricSupported);
    if (user?.anonId) {
      setBiometricEnabled(isBiometricEnabled(user.anonId));
    }
  }, [user?.anonId]);

  // Handle deep link navigation on page load
  useEffect(() => {
    const deepLinkData = parseDeepLinkParams();
    
    if (deepLinkData) {
      // Set the appropriate tab - default to "posts" for notification deep links
      if (deepLinkData.tab) {
        setActiveTab(deepLinkData.tab);
      } else if (deepLinkData.postId) {
        // For notification deep links, always go to "posts" tab (Your Posts)
        setActiveTab("posts");
      }
      
      // Highlight the specific post if provided
      if (deepLinkData.postId && deepLinkData.highlightPost) {
        setHighlightedPostId(deepLinkData.postId);
        
        // Scroll to the post after a brief delay to ensure it's rendered
        setTimeout(() => {
          const postFound = scrollToPost(deepLinkData.postId!);
          
          if (postFound) {
            // Show notification context
            toast({
              title: "📍 Post Found",
              description: "Here's the post from your notification",
            });
          } else {
            // Fallback message if post no longer exists
            toast({
              title: "⚠️ Post Not Found",
              description: "This post no longer exists.",
              variant: "destructive",
            });
          }
          
          // Remove highlight after 5 seconds
          setTimeout(() => {
            setHighlightedPostId(null);
          }, 5000);
        }, 500);
      }
      
      // Clear the deep link params from URL after handling
      setTimeout(() => {
        clearDeepLinkParams();
      }, 1000);
    }
  }, []);

  // Listen for deep link navigation events
  useEffect(() => {
    const handleDeepLinkNavigation = (event: CustomEvent) => {
      const { postId, tab, highlightPost } = event.detail;
      
      if (tab) {
        setActiveTab(tab);
      }
      
      if (postId && highlightPost) {
        setHighlightedPostId(postId);
        setTimeout(() => {
          const postFound = scrollToPost(postId);
          
          if (postFound) {
            toast({
              title: "📍 Post Found",
              description: "Here's the post from your notification",
            });
          } else {
            toast({
              title: "⚠️ Post Not Found",
              description: "This post no longer exists.",
              variant: "destructive",
            });
          }
          
          setTimeout(() => {
            setHighlightedPostId(null);
          }, 5000);
        }, 500);
      }
    };

    window.addEventListener('deepLinkNavigation', handleDeepLinkNavigation as EventListener);
    
    return () => {
      window.removeEventListener('deepLinkNavigation', handleDeepLinkNavigation as EventListener);
    };
  }, []);

  // Function to scroll to a specific post
  const scrollToPost = (postId: string): boolean => {
    const postElement = postRefs.current[postId];
    if (postElement) {
      postElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      return true;
    }
    return false;
  };

  // Get user's posts (using session ID for identification)
  const { data: userPosts = [], isLoading, refetch } = useQuery<Post[]>({
    queryKey: ["/api/posts", "user"],
    queryFn: async () => {
      const response = await fetch("/api/posts?sortBy=new&userOnly=true");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all relevant queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/posts", "user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/reactions"] });
      
      // Force refetch the main query
      await refetch();
      
      console.log('Profile posts refresh completed');
      
      toast({
        title: "Posts refreshed!",
        description: "Latest content and interactions have been loaded.",
      });
    } catch (error) {
      console.error('Profile posts refresh error:', error);
      toast({
        title: "Refresh failed",
        description: "Unable to load latest posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleAvatarSelect = (avatarId: string) => {
    updateProfile({ avatarId });
    setAvatarSelectorOpen(false);
    toast({
      title: "Avatar updated!",
      description: "Your new profile picture has been saved.",
    });
  };

  const handleColorSelect = async (color: string) => {
    await updateProfile({ avatarColor: color });
    toast({
      title: "Avatar color updated!",
      description: "Your profile picture color has been changed and will be visible to all users.",
    });
  };

  const handleClearData = () => {
    clearUserData();
    toast({
      title: "All data cleared",
      description: "Your anonymous session and local data have been cleared.",
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleSyncComplete = () => {
    setSyncDialogOpen(false);
    toast({
      title: "Cross-Device Sync Enabled",
      description: "You can now access your account from other devices.",
    });
  };

  const handleBiometricComplete = () => {
    setBiometricDialogOpen(false);
    if (user?.anonId) {
      setBiometricEnabled(isBiometricEnabled(user.anonId));
    }
  };

  const handleExportData = () => {
    const data = {
      reactions: Object.keys(localStorage).filter(key => key.startsWith('reactions-')),
      drafts: localStorage.getItem('tfess-post-draft'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tfess-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Admin password verification
  const handleAdminAccess = async () => {
    try {
      // Verify password server-side without exposing it
      const response = await fetch("/api/admin/verify-password", {
        method: "POST",
        body: JSON.stringify({ password: adminPassword }),
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        // Password verified, redirect to admin page
        setAdminPasswordOpen(false);
        setAdminPassword("");
        setAdminError("");
        window.location.href = "/admin";
      } else {
        setAdminError("Access Denied – Please try again.");
        setAdminPassword("");
      }
    } catch (error) {
      console.error("Admin password verification error:", error);
      setAdminError("Access Denied – Please try again.");
      setAdminPassword("");
    }
  };

  const handleAdminPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminPassword(e.target.value);
    setAdminError(""); // Clear error when typing
  };

  const handleAdminKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdminAccess();
    }
  };

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post deleted",
        description: "Your post has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate(postId);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      school: '🏫',
      work: '💼',
      relationships: '💕',
      family: '👨‍👩‍👧',
      money: '💸',
      'hot-takes': '🌍'
    };
    return emojis[category] || '';
  };

  const getPostSourceInfo = (post: Post) => {
    // Determine source based on postContext and communitySection
    if (post.postContext === 'daily-spill') {
      return { icon: <Coffee className="h-3 w-3" />, label: 'Daily Spill', route: '/daily-spill' };
    }
    
    if (post.postContext === 'community' && post.communitySection) {
      switch (post.communitySection) {
        case 'celebrity-tea':
          return { icon: <Star className="h-3 w-3" />, label: 'Celebrity Tea', route: '/community/celebrity-tea' };
        case 'story-time':
          return { icon: '📖', label: `Story Time${post.storyType ? ` (${post.storyType})` : ''}`, route: '/community/story-time' };
        case 'hot-topics':
          return { icon: <Flame className="h-3 w-3" />, label: 'Hot Topics', route: '/community/hot-topics' };
        case 'daily-debate':
          return { icon: <Zap className="h-3 w-3" />, label: 'Daily Debate', route: '/community/daily-debate' };
        case 'tea-experiments':
          return { icon: <FlaskConical className="h-3 w-3" />, label: 'Tea Experiments', route: '/community/tea-experiments' };
        case 'suggestions':
          return { icon: '💡', label: 'Feedback/Suggestions', route: '/community/suggestions' };
        default:
          return { icon: '🏠', label: 'Community', route: '/community' };
      }
    }
    
    // Default to home page
    return { icon: <Home className="h-3 w-3" />, label: 'Home Page', route: '/' };
  };

  const handleViewInContext = (post: Post) => {
    const sourceInfo = getPostSourceInfo(post);
    setLocation(sourceInfo.route);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 overflow-y-auto">
      <Header />
      <main className="px-4 pt-6 pb-20 space-y-6 max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              {/* Avatar with selector */}
              <div className="relative">
                <AvatarDisplay 
                  avatarId={userAvatarId} 
                  size="xl" 
                  className="border-4 border-white dark:border-gray-800 shadow-lg"
                  gradientColors={avatarColor}
                />
                
                {/* Avatar Edit Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 border-2 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-800"
                  onClick={() => setAvatarSelectorOpen(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-xl mb-2">{userAlias}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your anonymous Tfess username
                  </p>
                </div>
                
                {/* Avatar Customization */}
                <div className="flex flex-col gap-2">
                  <AvatarColorPicker
                    currentColor={avatarColor || 'gradient-purple-blue'}
                    onColorSelect={handleColorSelect}
                    className="mx-auto"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 py-2 px-3 rounded-md transition-all font-medium text-sm touch-manipulation select-none",
              activeTab === "posts"
                ? "bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300"
            )}
            onClick={() => setActiveTab("posts")}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <FileText className="h-4 w-4 mr-2" />
            My Posts
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 py-2 px-3 rounded-md transition-all font-medium text-sm touch-manipulation select-none",
              activeTab === "settings"
                ? "bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300"
            )}
            onClick={() => setActiveTab("settings")}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Posts</h3>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {userPosts.length} post{userPosts.length !== 1 ? 's' : ''}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-xs">Refresh</span>
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading your posts...</p>
              </div>
            )}

            {!isLoading && userPosts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12 min-h-[40vh] flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    You haven't spilled any tea yet.
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Share your thoughts, stories, and confessions with the community.
                  </p>
                </CardContent>
              </Card>
            )}

            {userPosts.map((post: Post) => {
              const sourceInfo = getPostSourceInfo(post);
              const isHighlighted = highlightedPostId === post.id;
              
              return (
                <div 
                  key={post.id} 
                  className="space-y-2"
                  ref={(el) => {
                    if (el) {
                      postRefs.current[post.id] = el;
                    }
                  }}
                >
                  <div 
                    className={cn(
                      "cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                      isHighlighted && "ring-2 ring-orange-400 ring-opacity-70 shadow-lg transform scale-[1.01]"
                    )}
                    onClick={() => handleViewInContext(post)}
                  >
                    <PostCard post={post} />
                  </div>
                  {isHighlighted && (
                    <div className="text-center">
                      <Badge 
                        variant="secondary" 
                        className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 animate-pulse"
                      >
                        📍 From your notification
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6 min-h-[60vh] pb-8">
            {/* Username Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Username Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AliasSelector
                  currentAlias={{ 
                    alias: userAlias,
                    hasEmoji: false,
                    generated: false
                  }}
                  onSelect={(newUsername) => {
                    updateProfile({ alias: newUsername.alias });
                    toast({
                      title: "Username updated!",
                      description: `You're now known as ${newUsername.alias}`,
                    });
                  }}
                />
              </CardContent>
            </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === "light" ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-400" />
                )}
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current: {theme === "light" ? "Light" : "Dark"} mode
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="min-w-[80px]"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-4 w-4 mr-1" />
                    Dark
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-1" />
                    Light
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Post Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Post Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Your post performance</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See anonymous view counts and engagement stats
                </p>
              </div>
              <Link href="/user-posts">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Stats
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Browser notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified about trending posts and updates
                </p>
              </div>
              <Button
                variant={notifications ? "default" : "outline"}
                size="sm"
                onClick={() => setNotifications(!notifications)}
              >
                {notifications ? "On" : "Off"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Safety */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy & Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                ✓ All posts are completely anonymous
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                ✓ No personal data is stored or tracked
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                ✓ Content is moderated for safety
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account & Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Account & Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account Type</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isUpgraded ? 'Anonymous with sync enabled' : 'Anonymous only'}
                </p>
              </div>
              {isUpgraded ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Check className="h-3 w-3 mr-1" />
                  Synced
                </Badge>
              ) : (
                <Badge variant="secondary">Anonymous</Badge>
              )}
            </div>

            {/* Cross-Device Sync */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cross-Device Sync</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access your account from other devices
                </p>
              </div>
              {isUpgraded ? (
                <Button variant="outline" size="sm" disabled>
                  <Check className="h-4 w-4 mr-1" />
                  Enabled
                </Button>
              ) : (
                <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RotateCw className="h-4 w-4 mr-1" />
                      Enable
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Enable Cross-Device Sync</DialogTitle>
                    </DialogHeader>
                    <SyncSetup onComplete={handleSyncComplete} />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Biometric Authentication */}
            {biometricSupported && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Biometric Login</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use Face ID, Touch ID, or fingerprint
                  </p>
                </div>
                {biometricEnabled ? (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    <Fingerprint className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Dialog open={biometricDialogOpen} onOpenChange={setBiometricDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Fingerprint className="h-4 w-4 mr-1" />
                        Setup
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Setup Biometric Login</DialogTitle>
                      </DialogHeader>
                      <BiometricSetup 
                        onComplete={handleBiometricComplete}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {/* Privacy Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Biometric data never leaves your device. Only encrypted authentication tokens are stored locally.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We only store minimal data locally for your experience
            </p>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="flex-1 text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ban System Testing Panel - ADMIN/DEV ONLY - Never visible to regular users */}
        <BanTestingPanel />

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={() => setHelpModalOpen("how-to-use")}
            >
              🔹 How to use Tfess
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setHelpModalOpen("guidelines")}
            >
              📝 Community Guidelines
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setHelpModalOpen("report")}
            >
              🔹 Report a Problem
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setHelpModalOpen("about")}
            >
              🔹 About Tfess
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

            {/* Hidden Admin Access - Only visible when scrolled to bottom */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 pb-2">
              <p>Tfess v1.0.0</p>
              <p>Made for anonymous sharing</p>
              <button
                onClick={() => setAdminPasswordOpen(true)}
                className="mt-3 text-xs dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200 opacity-50 hover:opacity-100 text-[#8d9ab3]"
              >Thank you for being apart of our team!</button>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={avatarSelectorOpen}
        onClose={() => setAvatarSelectorOpen(false)}
        currentAvatar={userAvatarId}
        onAvatarSelect={handleAvatarSelect}
      />
      {/* Admin Password Modal */}
      <Dialog open={adminPasswordOpen} onOpenChange={setAdminPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center">Enter Admin Access Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="sr-only">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Admin access code"
                value={adminPassword}
                onChange={handleAdminPasswordChange}
                onKeyDown={handleAdminKeyPress}
                className="text-center"
                autoFocus
              />
            </div>
            {adminError && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertDescription className="text-red-800 dark:text-red-200 text-center">
                  {adminError}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAdminPasswordOpen(false);
                  setAdminPassword("");
                  setAdminError("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdminAccess}
                disabled={!adminPassword.trim()}
                className="flex-1"
              >
                Access
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & Support Modals */}
      
      {/* How to Use Tfess Modal */}
      <Dialog open={helpModalOpen === "how-to-use"} onOpenChange={() => setHelpModalOpen("")}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Getting Started on Tfess</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <p className="mb-4">Learn how to get started with Tfess, from posting your first tea to voting in debates. This guide walks you through:</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📝 Creating Posts in Different Sections</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Navigate to any section (Home, Community, Daily, etc.)</li>
                    <li>Tap the floating '+' button or create post option</li>
                    <li>Choose your category and write your anonymous story</li>
                    <li>Add reactions and engage with the community</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">☕ Responding to Daily Prompts</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Check the Daily section for new prompts</li>
                    <li>Share your honest thoughts anonymously</li>
                    <li>Build your streak by posting daily</li>
                    <li>See how others respond to the same topics</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">💬 Reacting and Commenting</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Tap emoji reactions on posts you relate to</li>
                    <li>Add anonymous comments to share your perspective</li>
                    <li>Vote in drama polls and community debates</li>
                    <li>All interactions remain completely anonymous</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">⚙️ Managing Your Profile</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Customize your anonymous avatar and username</li>
                    <li>Set up notifications for daily prompts</li>
                    <li>View your post analytics and engagement</li>
                    <li>Sync across devices while staying anonymous</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={() => setHelpModalOpen("")} className="w-full">
                Got it, thanks!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Community Guidelines Modal */}
      <Dialog open={helpModalOpen === "guidelines"} onOpenChange={() => setHelpModalOpen("")}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Community Guidelines</DialogTitle>
            <p className="text-xs text-gray-500 text-center mt-1">Last Updated: August 2025</p>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <p className="mb-4">Keep Tfess safe, fair, and anonymous. By using this app, you agree to:</p>
              
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🤐 Respect Others' Anonymity</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-blue-800 dark:text-blue-200">
                    <li>Never try to identify other anonymous users</li>
                    <li>Don't share personal information about others</li>
                    <li>Keep conversations anonymous and respectful</li>
                  </ul>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">🚫 Avoid Harassment or Offensive Behavior</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-orange-800 dark:text-orange-200">
                    <li>No bullying, threats, or hate speech</li>
                    <li>Be respectful even when disagreeing</li>
                    <li>Report inappropriate content when you see it</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">⛔ No Spamming or Impersonation</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-green-800 dark:text-green-200">
                    <li>Don't flood feeds with repetitive content</li>
                    <li>One anonymous voice per person</li>
                    <li>Keep posts authentic and meaningful</li>
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">🚨 Report Abuse When You See It</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-red-800 dark:text-red-200">
                    <li>Help keep our community safe</li>
                    <li>Use the report function for violations</li>
                    <li>Trust that reports are handled fairly</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={() => setHelpModalOpen("")} className="w-full">
                I understand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report a Problem Modal */}
      <Dialog open={helpModalOpen === "report"} onOpenChange={() => setHelpModalOpen("")}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center">Report a Problem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Having an issue? Let us know! We're here to help with bugs, feature problems, or inappropriate content.
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="issue-type">What type of issue are you reporting?</Label>
                <select 
                  id="issue-type"
                  value={reportForm.issue}
                  onChange={(e) => setReportForm(prev => ({ ...prev, issue: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select an issue type</option>
                  <option value="Bug in the app">🐛 Bug in the app</option>
                  <option value="Feature not working">⚠️ Feature not working</option>
                  <option value="Inappropriate content">🚨 Something inappropriate</option>
                  <option value="Account issue">👤 Account issue</option>
                  <option value="Other">❓ Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="issue-description">Describe the issue</Label>
                <Textarea
                  id="issue-description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide as much detail as possible..."
                  className="w-full mt-1 min-h-[100px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-username"
                  checked={reportForm.includeUsername}
                  onCheckedChange={(checked) => setReportForm(prev => ({ ...prev, includeUsername: !!checked }))}
                />
                <Label htmlFor="include-username" className="text-sm">
                  Include my anonymous username for follow-up (optional)
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setHelpModalOpen("");
                  setReportForm({ issue: "", description: "", includeUsername: false });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReportSubmit}
                disabled={!reportForm.description.trim()}
                className="flex-1"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Tfess Modal */}
      <Dialog open={helpModalOpen === "about"} onOpenChange={() => setHelpModalOpen("")}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <span className="text-2xl">☕</span>
              About Tfess
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <p className="mb-4">
                Tfess is an anonymous social app built for raw expression, honest thoughts, and community-powered interaction. 
                Built for modern gossip, confessions, debates, and more.
              </p>
              
              <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Version:</span>
                  <Badge variant="secondary">1.0.0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Developer:</span>
                  <span className="text-sm">Tfess Team</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Support:</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400">support@tfess.app</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  🎭 Your anonymity is our priority. Share freely, connect safely.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={() => setHelpModalOpen("")} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}