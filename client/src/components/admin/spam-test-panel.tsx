import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Shield, User, Clock } from "lucide-react";

export function SpamTestPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);

  const toggleAdminMode = () => {
    if (!isAdmin) {
      // Enable admin mode
      const adminSessionId = 'admin_test_' + Date.now();
      localStorage.setItem('admin_session_override', adminSessionId);
      setIsAdmin(true);
      console.log('Admin mode enabled with session:', adminSessionId);
    } else {
      // Disable admin mode
      localStorage.removeItem('admin_session_override');
      setIsAdmin(false);
      console.log('Admin mode disabled');
    }
  };

  const testSpamLimit = async () => {
    const testPost = {
      content: `Test post ${Date.now()}`,
      category: 'work',
      postContext: 'home'
    };

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPost),
      });

      if (response.status === 429) {
        const data = await response.json();
        setCooldownTime(data.cooldownMinutes || 5);
        console.log('Hit spam limit:', data.message);
      } else if (response.ok) {
        setPostCount(prev => prev + 1);
        console.log('Post created successfully');
      }
    } catch (error) {
      console.error('Test post failed:', error);
    }
  };

  const resetCounter = () => {
    setPostCount(0);
    setCooldownTime(0);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-white/95 backdrop-blur-sm border shadow-lg z-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Spam Detection Testing
        </CardTitle>
        <CardDescription className="text-xs">
          Development testing panel for spam limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Admin Mode:</span>
          <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
            {isAdmin ? "ON" : "OFF"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Test Posts:</span>
          <Badge variant="outline" className="text-xs">
            {postCount}/4
          </Badge>
        </div>

        {cooldownTime > 0 && (
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Cooldown: {cooldownTime}min</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={isAdmin ? "destructive" : "default"}
            onClick={toggleAdminMode}
            className="flex-1 text-xs"
          >
            {isAdmin ? "Disable Admin" : "Enable Admin"}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testSpamLimit}
            className="flex-1 text-xs"
          >
            Test Post
          </Button>
        </div>

        <Button 
          size="sm" 
          variant="ghost" 
          onClick={resetCounter}
          className="w-full text-xs"
        >
          Reset Counter
        </Button>

        <div className="text-xs text-gray-500 border-t pt-2">
          <p><strong>Regular users:</strong> 4 posts max, 5min cooldown</p>
          <p><strong>Admin users:</strong> Unlimited posts, no cooldowns</p>
        </div>
      </CardContent>
    </Card>
  );
}