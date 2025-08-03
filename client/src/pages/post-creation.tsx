import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAvatarById } from "@/lib/avatars";
import { useUserAvatar } from "@/hooks/use-user-avatar";
import { useLocation } from "wouter";

const categories = [
  { id: "school", label: "🏫 School", emoji: "🏫" },
  { id: "work", label: "💼 Work", emoji: "💼" },
  { id: "relationships", label: "💕 Relationships", emoji: "💕" },
  { id: "family", label: "👨‍👩‍👧 Family", emoji: "👨‍👩‍👧" },
  { id: "money", label: "💸 Money", emoji: "💸" },
  { id: "hot-takes", label: "🌍 Hot Takes", emoji: "🌍" },
  { id: "drama", label: "🎭 Am I in the Wrong?", emoji: "🎭" },
];

export default function PostCreation() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userAvatarId } = useUserAvatar();
  const [, setLocation] = useLocation();

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; category: string; avatarId: string }) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      setCategory("");
      setLocation("/");
      toast({
        title: "Post created!",
        description: "Your anonymous post has been shared with the community.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !category) return;

    createPostMutation.mutate({
      content: content.trim(),
      category,
      avatarId: userAvatarId,
    });
  };

  const selectedCategory = categories.find(c => c.id === category);
  const currentAvatar = getAvatarById(userAvatarId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="px-4 pt-6 pb-20 space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Share Your Tea ☕</CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Post anonymously to the TeaSpill community
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Avatar Preview */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-200">
                  {currentAvatar ? (
                    <div 
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: currentAvatar.svg }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Posting as Anonymous</p>
                  <p className="text-xs text-gray-500">Your identity is protected</p>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center">
                          {cat.emoji} {cat.label.replace(cat.emoji + " ", "")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Story</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's happening? Share your thoughts, stories, or questions..."
                  rows={6}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="text-xs text-gray-500 text-right">
                  {content.length}/500 characters
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setLocation("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!content.trim() || !category || createPostMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <BottomNav />
    </div>
  );
}