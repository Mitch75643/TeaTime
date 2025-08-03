import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Input } from "./input";
import { Label } from "./label";
import { X, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateAlias } from "@/lib/aliases";
import { saveDraft, loadDraft, clearDraft, hasDraft } from "@/lib/draft-storage";
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

const popularTags = [
  "#helpme", "#funny", "#advice", "#drama", "#college", "#work", 
  "#relationships", "#family", "#money", "#politics", "#fml", "#lol",
  "#rant", "#confession", "#tea", "#gossip", "#support", "#validation",
  "#nsfw", "#serious", "#update", "#urgent", "#anonymous", "#story"
];

export function PostModal({ isOpen, onClose }: PostModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [currentAlias, setCurrentAlias] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Generate a new alias and load draft when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentAlias(generateAlias());
      
      // Load saved draft if exists
      const draft = loadDraft();
      if (draft) {
        setContent(draft.content);
        setCategory(draft.category);
        setSelectedTags(draft.tags);
      }
    }
  }, [isOpen]);

  // Auto-save draft as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen && (content.trim() || category || selectedTags.length > 0)) {
        saveDraft({
          content,
          category,
          tags: selectedTags,
        });
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [content, category, selectedTags, isOpen]);

  const createPostMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      clearDraft(); // Clear draft after successful post
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

    // Combine selected tags with any manually typed ones
    const manualTags = tagsInput
      .split(/[\s,]+/)
      .filter(tag => tag.trim())
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
    
    const allTags = [...new Set([...selectedTags, ...manualTags])].slice(0, 5);

    createPostMutation.mutate({
      content: content.trim(),
      category: category as any,
      tags: allTags,
    });
  };

  const handleClose = () => {
    setContent("");
    setCategory("");
    setTagsInput("");
    setSelectedTags([]);
    setShowTagSuggestions(false);
    onClose();
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const filteredTagSuggestions = popularTags.filter(tag => 
    tag.toLowerCase().includes(tagsInput.toLowerCase()) && 
    !selectedTags.includes(tag)
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Spill the Tea ☕</span>
              {hasDraft() && (
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                  Draft saved
                </span>
              )}
            </div>
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
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Your alias: <span className="font-medium text-purple-600 dark:text-purple-400">{currentAlias}</span></span>
              <span className={content.length > 450 ? "text-red-500" : ""}>{content.length}/500</span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center">
              <Hash className="h-4 w-4 mr-1" />
              Add tags (optional)
            </Label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-purple-600 dark:hover:text-purple-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <div className="relative">
              <Input
                ref={tagInputRef}
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                placeholder="Type or select tags..."
                maxLength={50}
              />
              
              {/* Tag Suggestions */}
              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                  {filteredTagSuggestions.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Popular Tags Quick Select */}
            <div className="flex flex-wrap gap-1">
              {popularTags.slice(0, 6).filter(tag => !selectedTags.includes(tag)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                  disabled={selectedTags.length >= 5}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select up to 5 tags. Popular suggestions shown above.
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
