import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Input } from "./input";
import { Label } from "./label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertPost } from "@shared/schema";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { value: "college", label: "🎓 College", gradient: "gradient-secondary" },
  { value: "work", label: "💼 Work", gradient: "gradient-primary" },
  { value: "relationships", label: "💕 Love", gradient: "gradient-drama" },
  { value: "family", label: "👨‍👩‍👧‍👦 Family", gradient: "gradient-soft" },
  { value: "money", label: "💰 Money", gradient: "gradient-secondary" },
  { value: "politics", label: "🗳️ Politics", gradient: "gradient-primary" },
  { value: "drama", label: "🎭 Am I the Drama?", gradient: "gradient-drama" },
];

export function PostModal({ isOpen, onClose }: PostModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post created!",
        description: "Your anonymous post has been shared with the community.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim() || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 500) {
      toast({
        title: "Post too long",
        description: "Posts must be 500 characters or less.",
        variant: "destructive",
      });
      return;
    }

    const tags = tagsInput
      .split(/[\s,]+/)
      .filter(tag => tag.trim())
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      .slice(0, 5); // Limit to 5 tags

    createPostMutation.mutate({
      content: content.trim(),
      category: category as any,
      tags,
    });
  };

  const handleClose = () => {
    setContent("");
    setCategory("");
    setTagsInput("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg mx-4 rounded-3xl border-2 border-pink-100/50 glass animate-slide-up">
        <DialogHeader className="text-center pb-4 border-b border-pink-100/50">
          <DialogTitle className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
              <span className="text-lg">☕</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Spill the Tea</h2>
              <p className="text-xs text-gray-500 font-medium">Share your story anonymously</p>
            </div>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Pick your vibe ✨</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant="ghost"
                  className={cn(
                    "p-4 rounded-2xl text-left transition-all duration-300 border-2 border-transparent button-hover-lift",
                    category === cat.value 
                      ? `${cat.gradient} text-white shadow-lg transform scale-105 border-white/20`
                      : "bg-white/60 text-gray-700 hover:bg-white/80 hover:shadow-md border-pink-100/30"
                  )}
                  onClick={() => setCategory(cat.value)}
                >
                  <div className="text-sm font-semibold">{cat.label}</div>
                </Button>
              ))}
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">What's the tea? 🍵</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, vent, confess, or spill some drama... Stay anonymous!"
              className="h-32 resize-none rounded-2xl border-2 border-pink-100/50 bg-white/60 backdrop-blur-sm focus:border-pink-300 focus:bg-white/80 transition-all duration-200"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">
                Your alias: <span className="font-semibold gradient-primary bg-clip-text text-transparent">Anonymous User</span>
              </span>
              <span className={cn(
                "font-semibold",
                content.length > 450 ? "text-red-500" : "text-gray-500"
              )}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Add some tags 🏷️</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#helpme #funny #advice #drama"
              className="rounded-2xl border-2 border-pink-100/50 bg-white/60 backdrop-blur-sm focus:border-pink-300 focus:bg-white/80 transition-all duration-200"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              Separate with spaces or commas. Max 5 tags.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={createPostMutation.isPending || !content.trim() || !category}
            className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 button-hover-lift"
          >
            {createPostMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Posting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>☕</span>
                <span>Post Anonymously</span>
                <span>✨</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
