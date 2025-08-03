import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Input } from "./input";
import { Label } from "./label";
import { X, Hash, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateAlias } from "@/lib/aliases";
import type { InsertPost } from "@shared/schema";

interface SectionPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  sectionTitle: string;
  promptText?: string;
}

const popularTags = [
  "#helpme", "#funny", "#advice", "#drama", "#college", "#work", 
  "#relationships", "#family", "#money", "#politics", "#fml", "#lol",
  "#rant", "#confession", "#tea", "#gossip", "#support", "#validation",
  "#nsfw", "#serious", "#update", "#urgent", "#anonymous", "#story"
];

export function SectionPostModal({ 
  isOpen, 
  onClose, 
  section, 
  sectionTitle,
  promptText = ""
}: SectionPostModalProps) {
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Section-specific fields
  const [celebrityName, setCelebrityName] = useState("");
  const [storyType, setStoryType] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [pollOptionA, setPollOptionA] = useState("");
  const [pollOptionB, setPollOptionB] = useState("");
  
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
    if (!content.trim()) {
      toast({
        title: "Missing content",
        description: "Please write something to share.",
        variant: "destructive",
      });
      return;
    }

    // Section-specific validation
    if (section === "celebrity-tea" && !celebrityName.trim()) {
      toast({
        title: "Missing celebrity name",
        description: "Please specify which celebrity this is about.",
        variant: "destructive",
      });
      return;
    }

    if (section === "story-time" && !storyType) {
      toast({
        title: "Missing story type",
        description: "Please select what type of story this is.",
        variant: "destructive",
      });
      return;
    }

    if (section === "tea-experiments" && (!pollOptionA.trim() || !pollOptionB.trim())) {
      toast({
        title: "Missing poll options",
        description: "Please provide both poll options.",
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

    // Build the post data based on section
    const postData: InsertPost = {
      content: content.trim(),
      category: getDefaultCategory(section),
      tags: allTags,
      postContext: section === "daily-tea" ? "daily" : "community",
      communitySection: section === "daily-tea" ? null : section,
      postType: getPostType(section),
      allowComments: section !== "daily-debate",
    };

    // Add section-specific fields
    if (section === "celebrity-tea") {
      postData.celebrityName = celebrityName.trim();
    }
    if (section === "story-time") {
      postData.storyType = storyType as any;
    }
    if (section === "hot-topics" && topicTitle.trim()) {
      postData.topicTitle = topicTitle.trim();
    }
    if (section === "tea-experiments") {
      postData.pollOptions = {
        optionA: pollOptionA.trim(),
        optionB: pollOptionB.trim()
      };
    }

    createPostMutation.mutate(postData);
  };

  const handleClose = () => {
    setContent("");
    setCelebrityName("");
    setStoryType("");
    setTopicTitle("");
    setPollOptionA("");
    setPollOptionB("");
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
          <DialogTitle>{sectionTitle}</DialogTitle>
          <DialogDescription>
            Share your thoughts with the community
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Daily Tea Prompt */}
          {section === "daily-tea" && promptText && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Today's Prompt:</p>
              <p className="text-purple-900 dark:text-purple-100">"{promptText}"</p>
            </div>
          )}

          {/* Celebrity Tea - Celebrity Name Input */}
          {section === "celebrity-tea" && (
            <div>
              <Label htmlFor="celebrity-name">Who's the celebrity?</Label>
              <Input
                id="celebrity-name"
                value={celebrityName}
                onChange={(e) => setCelebrityName(e.target.value)}
                placeholder="e.g., Taylor Swift, Ryan Reynolds..."
                className="mt-1"
              />
            </div>
          )}

          {/* Story Time - Story Type Selection */}
          {section === "story-time" && (
            <div>
              <Label htmlFor="story-type">Choose Your Story Type</Label>
              <Select value={storyType} onValueChange={setStoryType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="What kind of story is this?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horror">👻 Horror</SelectItem>
                  <SelectItem value="funny">😂 Funny</SelectItem>
                  <SelectItem value="weird">🤪 Weird</SelectItem>
                  <SelectItem value="romantic">💕 Romantic</SelectItem>
                  <SelectItem value="embarrassing">😳 Embarrassing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hot Topics - Custom Topic Field */}
          {section === "hot-topics" && (
            <div>
              <Label htmlFor="topic-title">Hot Topic (Optional)</Label>
              <Input
                id="topic-title"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="What's the hot topic you want to discuss?"
                className="mt-1"
              />
            </div>
          )}

          {/* Daily Debate - Opinion Prompt */}
          {section === "daily-debate" && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Share your controversial opinion or question:</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Note: This post will only allow thumbs up/down voting, no comments.</p>
            </div>
          )}

          {/* Tea Experiments - Poll Options */}
          {section === "tea-experiments" && (
            <div className="space-y-3">
              <Label>Create Your Poll</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="option-a" className="text-sm">Option A</Label>
                  <Input
                    id="option-a"
                    value={pollOptionA}
                    onChange={(e) => setPollOptionA(e.target.value)}
                    placeholder="First choice..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="option-b" className="text-sm">Option B</Label>
                  <Input
                    id="option-b"
                    value={pollOptionB}
                    onChange={(e) => setPollOptionB(e.target.value)}
                    placeholder="Second choice..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Textarea */}
          <div>
            <Label htmlFor="content">
              {section === "daily-debate" ? "Your Opinion" : "Your Post"}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getContentPlaceholder(section)}
              className="mt-1 min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{content.length}/500 characters</p>
          </div>

          {/* Tags Section */}
          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <div className="mt-1 space-y-2">
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onFocus={() => setShowTagSuggestions(true)}
                  placeholder="Add tags..."
                  className="pr-8"
                />
                <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-32 overflow-y-auto">
                  {filteredTagSuggestions.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createPostMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {createPostMutation.isPending ? "Posting..." : "Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function getDefaultCategory(section: string): string {
  switch (section) {
    case "celebrity-tea": return "gossip";
    case "story-time": return "story";
    case "hot-topics": return "other";
    case "daily-debate": return "debate";
    case "tea-experiments": return "poll";
    case "daily-tea": return "daily";
    case "just-for-fun": return "other";
    case "suggestions": return "other";
    default: return "other";
  }
}

function getPostType(section: string): "standard" | "poll" | "debate" {
  switch (section) {
    case "tea-experiments": return "poll";
    case "daily-debate": return "debate";
    default: return "standard";
  }
}

function getContentPlaceholder(section: string): string {
  switch (section) {
    case "daily-tea":
      return "Share your response to today's prompt...";
    case "celebrity-tea":
      return "Spill the tea about this celebrity...";
    case "story-time":
      return "Tell us your story...";
    case "hot-topics":
      return "What's your take on this hot topic?";
    case "daily-debate":
      return "Share your controversial opinion or thought-provoking question...";
    case "tea-experiments":
      return "Describe your poll and let the community decide...";
    default:
      return "Share your thoughts...";
  }
}