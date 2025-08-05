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
import { useUserAvatar } from "@/hooks/use-user-avatar";
import { useUserAlias } from "@/hooks/use-user-alias";
import { useAvatarColor } from "@/hooks/use-avatar-color";
import { getAvatarById } from "@/lib/avatars";
import { saveDraft, loadDraft, clearDraft, hasDraft } from "@/lib/draft-storage";
import { HomeCategoryAnimation, useHomeCategoryAnimation } from "./home-category-animations";
import { OtherCategoryEffect, useOtherCategoryEffect } from "./other-category-effect";
import type { InsertPost, ModerationResponse } from "@shared/schema";
import { MentalHealthSupport } from "@/components/ui/mental-health-support";
import { useDeviceFingerprint } from "@/hooks/use-device-fingerprint";
import { AccessDeniedMessage } from "@/components/ui/ban-screen";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
  defaultTags?: string[];
  promptText?: string;
  sectionTheme?: string;
  postContext?: PostModalContext;
}

const categories = [
  { value: "school", label: "🏫 School" },
  { value: "work", label: "💼 Work" },
  { value: "relationships", label: "💕 Relationships" },
  { value: "family", label: "👨‍👩‍👧 Family" },
  { value: "money", label: "💸 Money" },
  { value: "hot-takes", label: "🌍 Hot Takes" },
  { value: "drama", label: "🎭 Am I in the Wrong?" },
  { value: "other", label: "📝 Other" },
];

const popularTags = [
  "#helpme", "#funny", "#advice", "#drama", "#college", "#work", 
  "#relationships", "#family", "#money", "#politics", "#fml", "#lol",
  "#rant", "#confession", "#tea", "#gossip", "#support", "#validation",
  "#nsfw", "#serious", "#update", "#urgent", "#anonymous", "#story"
];

interface PostModalContext {
  page: 'home' | 'daily' | 'community';
  section?: string;
}

export function PostModal({ 
  isOpen, 
  onClose, 
  defaultCategory = "", 
  defaultTags = [], 
  promptText = "", 
  sectionTheme = "",
  postContext = { page: 'home' }
}: PostModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [moderationResponse, setModerationResponse] = useState<{
    severityLevel: 1 | 2 | 3;
    supportMessage?: string;
    resources?: Array<{
      title: string;
      url: string;
      phone?: string;
    }>;
  } | null>(null);
  const [showMentalHealthSupport, setShowMentalHealthSupport] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tagInputRef = useRef<HTMLInputElement>(null);
  const { userAvatarId } = useUserAvatar();
  const { userAlias } = useUserAlias();
  const { avatarColor } = useAvatarColor();
  const { animation, triggerAnimation, completeAnimation } = useHomeCategoryAnimation();
  const { isVisible: otherEffectVisible, triggerEffect: triggerOtherEffect, completeEffect: completeOtherEffect } = useOtherCategoryEffect();
  const { canPerformAction, getFingerprint, banInfo } = useDeviceFingerprint();

  console.log("PostModal render - isOpen:", isOpen, "category:", category, "defaultCategory:", defaultCategory);

  // Initialize state when modal opens (only run once per modal open)
  useEffect(() => {
    if (isOpen) {
      // Set default values if provided (only once when modal opens)
      if (defaultCategory) {
        console.log("Setting default category:", defaultCategory);
        setCategory(defaultCategory);
      }
      
      if (defaultTags.length > 0) {
        setSelectedTags(defaultTags);
      }
      
      // Load saved draft if exists (only if no defaults provided)
      if (!defaultCategory && defaultTags.length === 0) {
        const draft = loadDraft();
        if (draft) {
          setContent(draft.content);
          setCategory(draft.category);
          setSelectedTags(draft.tags);
        }
      }
    } else {
      // Reset state when modal closes
      setContent("");
      setCategory("");
      setSelectedTags([]);
      setTagsInput("");
    }
  }, [isOpen]); // Only depend on isOpen to prevent constant resets

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
    mutationFn: async (data: InsertPost & { postContext?: string; communitySection?: string }): Promise<any> => {
      // Check if user is banned before attempting to post
      if (!canPerformAction('post')) {
        throw new Error("Access denied - device is banned from posting");
      }

      const deviceFingerprint = getFingerprint();
      if (!deviceFingerprint) {
        throw new Error("Device security check failed");
      }

      return apiRequest("POST", "/api/posts", {
        ...data,
        alias: userAlias,
        avatarId: userAvatarId,
        avatarColor: avatarColor,
        deviceFingerprint
      });
    },
    onSuccess: (response) => {
      // Check if there's a moderation response
      if (response.moderationResponse) {
        setModerationResponse(response.moderationResponse);
        setShowMentalHealthSupport(true);
      }
      
      // Invalidate all post queries to ensure posts appear everywhere they should
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      clearDraft(); // Clear draft after successful post
      
      // Trigger effects for home page posts
      if (postContext.page === 'home' && category) {
        if (category === 'other') {
          // Special effect for "Other" category
          triggerOtherEffect();
        } else {
          // Regular category animation for other categories
          const animationCategory = category === 'drama' ? 'wrong' : category;
          triggerAnimation(animationCategory);
        }
      }
      
      toast({
        title: "Post created!",
        description: "Your anonymous post has been shared with the community.",
      });
      
      // Only close if no mental health support needed
      if (!response.moderationResponse) {
        if (category === 'other') {
          // Longer delay for Other category effect
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          // Standard delay for regular animations
          setTimeout(() => {
            handleClose();
          }, 1000);
        }
      }
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
    // Check if user is banned
    if (!canPerformAction('post')) {
      toast({
        title: "Access Denied",
        description: banInfo?.banReason || "Your device is banned from posting",
        variant: "destructive",
      });
      return;
    }

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
    
    const allTags = Array.from(new Set([...selectedTags, ...manualTags])).slice(0, 5);

    createPostMutation.mutate({
      content: content.trim(),
      category: category as any,
      tags: allTags,
      postContext: postContext.page,
      communitySection: postContext.section,
      postType: "standard",
      allowComments: true,
    });
  };

  const handleClose = () => {
    setContent("");
    setCategory("");
    setTagsInput("");
    setSelectedTags([]);
    setShowTagSuggestions(false);
    setModerationResponse(null);
    setShowMentalHealthSupport(false);
    onClose();
  };

  const handleMentalHealthAcknowledge = () => {
    setShowMentalHealthSupport(false);
    setModerationResponse(null);
    handleClose();
  };

  const handleMentalHealthClose = () => {
    setShowMentalHealthSupport(false);
    setModerationResponse(null);
    handleClose();
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
      <DialogContent className="w-[95vw] max-w-md mx-auto my-8 max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex items-center gap-2">
                  Spill the Tea 
                  <span className="inline-block" style={{ fontSize: '1.1rem', lineHeight: '1', fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"' }}>☕</span>
                </span>
                {hasDraft() && (
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                    Draft saved
                  </span>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Choose a category</Label>
            <Select value={category} onValueChange={(value) => {
              console.log("Category selected:", value);
              setCategory(value);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent className="z-[100]">
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
              placeholder={promptText ? `Responding to: "${promptText}"` : "Share your thoughts anonymously..."}
              className="h-24 resize-none"
              maxLength={500}
              autoFocus
            />
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Your username: <span className="font-medium text-purple-600 dark:text-purple-400">{userAlias}</span></span>
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
      
      {/* Home Category Animation */}
      <HomeCategoryAnimation
        isVisible={animation.isVisible}
        onComplete={completeAnimation}
        category={animation.category}
      />

      {/* Other Category Effect */}
      <OtherCategoryEffect
        isVisible={otherEffectVisible}
        onComplete={completeOtherEffect}
      />

      {/* Mental Health Support Modal */}
      {moderationResponse && (
        <MentalHealthSupport
          moderationResponse={moderationResponse}
          isOpen={showMentalHealthSupport}
          onClose={handleMentalHealthClose}
          onAcknowledge={handleMentalHealthAcknowledge}
        />
      )}
    </Dialog>
  );
}
