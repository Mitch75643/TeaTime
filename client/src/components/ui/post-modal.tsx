import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Input } from "./input";
import { Label } from "./label";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertPost } from "@shared/schema";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { value: "college", label: "🎓 College" },
  { value: "work", label: "💼 Work" },
  { value: "relationships", label: "💕 Relationships" },
  { value: "family", label: "👨‍👩‍👧‍👦 Family" },
  { value: "money", label: "💰 Money" },
  { value: "politics", label: "🗳️ Politics" },
  { value: "drama", label: "🎭 Am I the Drama?" },
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
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Spill the Tea ☕</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Choose a category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Content */}
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts anonymously..."
              className="h-32 resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Your alias: <span className="font-medium text-purple-600">Anonymous User</span></span>
              <span className={content.length > 450 ? "text-red-500" : ""}>{content.length}/500</span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Add tags (optional)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#helpme #funny #advice"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              Separate multiple tags with spaces or commas. Max 5 tags.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={createPostMutation.isPending || !content.trim() || !category}
            className="w-full gradient-primary text-white"
          >
            {createPostMutation.isPending ? "Posting..." : "Post Anonymously"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
