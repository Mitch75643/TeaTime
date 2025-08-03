import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAvatarById } from "@/lib/avatars";

const categories = [
  { id: "school", label: "🏫 School", emoji: "🏫" },
  { id: "work", label: "💼 Work", emoji: "💼" },
  { id: "relationships", label: "💕 Relationships", emoji: "💕" },
  { id: "family", label: "👨‍👩‍👧 Family", emoji: "👨‍👩‍👧" },
  { id: "money", label: "💸 Money", emoji: "💸" },
  { id: "hot-takes", label: "🌍 Hot Takes", emoji: "🌍" },
  { id: "drama", label: "🎭 Am I in the Wrong?", emoji: "🎭" },
];

interface PostCreationModalProps {
  trigger: React.ReactNode;
  onPostCreated?: () => void;
}

export function PostCreationModal({ trigger, onPostCreated }: PostCreationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; category: string; avatarId: string }) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      setCategory("");
      setIsOpen(false);
      onPostCreated?.();
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

    // Get user's selected avatar from localStorage
    const avatarId = localStorage.getItem('userAvatarId') || 'happy-face';
    
    createPostMutation.mutate({
      content: content.trim(),
      category,
      avatarId,
    });
  };

  const selectedCategory = categories.find(c => c.id === category);
  const currentAvatar = getAvatarById(localStorage.getItem('userAvatarId') || 'happy-face');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Share Your Tea ☕</DialogTitle>
          <p className="text-sm text-gray-600 text-center">
            Post anonymously to the TeaSpill community
          </p>
        </DialogHeader>
        
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
              rows={4}
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
              onClick={() => setIsOpen(false)}
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
      </DialogContent>
    </Dialog>
  );
}