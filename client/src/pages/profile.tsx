import { useState } from "react";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
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
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleExportData = () => {
    const data = {
      reactions: Object.keys(localStorage).filter(key => key.startsWith('reactions-')),
      drafts: localStorage.getItem('teaspill-post-draft'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teaspill-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="px-4 pt-6 pb-20 space-y-6 max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-xl">Anonymous User</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your identity is always protected on TeaSpill
            </p>
          </CardHeader>
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
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-300">
                ✓ Content is moderated for safety
              </p>
            </div>
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
              How to use TeaSpill
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Community Guidelines
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Report a Problem
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              About TeaSpill
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          <p>TeaSpill v1.0.0</p>
          <p>Made for anonymous sharing</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}