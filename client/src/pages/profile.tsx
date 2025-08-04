import { useState, useEffect } from "react";
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
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { AvatarSelector } from "@/components/ui/avatar-selector";
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
import { Link } from "wouter";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "settings">("posts");
  const { profile, getCachedProfile, updateProfile } = useUserProfile();
  
  // Use cached profile data to prevent flashing
  const cachedProfile = getCachedProfile();
  const userAvatarId = profile?.avatarId || cachedProfile?.avatarId || 'mask-anonymous';
  const userAlias = profile?.alias || cachedProfile?.alias || 'Anonymous';
  const avatarColor = profile?.avatarColor || cachedProfile?.avatarColor;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
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

  // Get user's posts (using session ID for identification)
  const { data: userPosts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "user"],
    queryFn: async () => {
      const response = await fetch("/api/posts?sortBy=new&userOnly=true");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              "flex-1 py-2 px-3 rounded-md transition-all font-medium text-sm",
              activeTab === "posts"
                ? "bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300"
            )}
            onClick={() => setActiveTab("posts")}
          >
            <FileText className="h-4 w-4 mr-2" />
            My Posts
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 py-2 px-3 rounded-md transition-all font-medium text-sm",
              activeTab === "settings"
                ? "bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300"
            )}
            onClick={() => setActiveTab("settings")}
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
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {userPosts.length} post{userPosts.length !== 1 ? 's' : ''}
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
                <CardContent className="text-center py-12">
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
              return (
                <div key={post.id} className="space-y-2">
                  <div 
                    className="cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleViewInContext(post)}
                  >
                    <PostCard post={post} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
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
                  currentAlias={{ alias: userAlias, emoji: '', category: '' }}
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
            <Button variant="ghost" className="w-full justify-start">
              How to use Tfess
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Community Guidelines
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Report a Problem
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              About Tfess
            </Button>
          </CardContent>
        </Card>

            {/* App Info */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
              <p>Tfess v1.0.0</p>
              <p>Made for anonymous sharing</p>
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
    </div>
  );
}