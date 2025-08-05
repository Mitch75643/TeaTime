import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { CelebrationAnimation, useCelebration } from "./celebration-animations";
import { CommunityTopicAnimation, useCommunityTopicAnimation } from "./community-topic-animations";
import type { InsertPost } from "@shared/schema";

interface SectionPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  sectionTitle: string;
  category?: string;
  promptText?: string;
  prefilledCelebrity?: string;
  onPostSuccess?: (section: string) => void;
}

const popularTags = [
  "#helpme", "#funny", "#advice", "#drama", "#school", "#work", 
  "#relationships", "#family", "#money", "#hot-takes", "#fml", "#lol",
  "#rant", "#confession", "#tea", "#gossip", "#support", "#validation",
  "#nsfw", "#serious", "#update", "#urgent", "#anonymous", "#story"
];

const debateTags = [
  "#ethics", "#school", "#dating", "#money", "#work", "#society", 
  "#culture", "#technology", "#relationships", "#lifestyle", "#hot-takes"
];

const hotTopicsTags = [
  "#trending", "#viral", "#controversial", "#breaking", "#popculture",
  "#tech", "#hot-takes", "#social", "#entertainment", "#news"
];

// Weekly theme configuration with color mappings
const WEEKLY_THEMES_CONFIG = {
  "Love Week": { 
    bgColor: "bg-pink-50", darkBgColor: "dark:bg-pink-900/20",
    borderColor: "border-pink-200", darkBorderColor: "dark:border-pink-700",
    textColor: "text-pink-800", darkTextColor: "dark:text-pink-200",
    accentColor: "text-pink-700", darkAccentColor: "dark:text-pink-300"
  },
  "Drama Week": { 
    bgColor: "bg-red-50", darkBgColor: "dark:bg-red-900/20",
    borderColor: "border-red-200", darkBorderColor: "dark:border-red-700",
    textColor: "text-red-800", darkTextColor: "dark:text-red-200",
    accentColor: "text-red-700", darkAccentColor: "dark:text-red-300"
  },
  "Mystery Week": { 
    bgColor: "bg-gray-50", darkBgColor: "dark:bg-gray-900/20",
    borderColor: "border-gray-400", darkBorderColor: "dark:border-gray-600",
    textColor: "text-gray-800", darkTextColor: "dark:text-gray-200",
    accentColor: "text-gray-700", darkAccentColor: "dark:text-gray-300"
  },
  "Fun Week": { 
    bgColor: "bg-yellow-50", darkBgColor: "dark:bg-yellow-900/20",
    borderColor: "border-yellow-200", darkBorderColor: "dark:border-yellow-700",
    textColor: "text-yellow-800", darkTextColor: "dark:text-yellow-200",
    accentColor: "text-yellow-700", darkAccentColor: "dark:text-yellow-300"
  },
  "Rant Week": { 
    bgColor: "bg-red-50", darkBgColor: "dark:bg-red-900/20",
    borderColor: "border-red-200", darkBorderColor: "dark:border-red-700",
    textColor: "text-red-800", darkTextColor: "dark:text-red-200",
    accentColor: "text-red-700", darkAccentColor: "dark:text-red-300"
  },
  "Roast Week": { 
    bgColor: "bg-orange-50", darkBgColor: "dark:bg-orange-900/20",
    borderColor: "border-orange-200", darkBorderColor: "dark:border-orange-700",
    textColor: "text-orange-800", darkTextColor: "dark:text-orange-200",
    accentColor: "text-orange-700", darkAccentColor: "dark:text-orange-300"
  },
  "Unpopular Opinions": { 
    bgColor: "bg-purple-50", darkBgColor: "dark:bg-purple-900/20",
    borderColor: "border-purple-200", darkBorderColor: "dark:border-purple-700",
    textColor: "text-purple-800", darkTextColor: "dark:text-purple-200",
    accentColor: "text-purple-700", darkAccentColor: "dark:text-purple-300"
  },
  "Chaos Week": { 
    bgColor: "bg-green-50", darkBgColor: "dark:bg-green-900/20",
    borderColor: "border-green-200", darkBorderColor: "dark:border-green-700",
    textColor: "text-green-800", darkTextColor: "dark:text-green-200",
    accentColor: "text-green-700", darkAccentColor: "dark:text-green-300"
  },
  "Money Week": { 
    bgColor: "bg-green-50", darkBgColor: "dark:bg-green-900/20",
    borderColor: "border-green-200", darkBorderColor: "dark:border-green-700",
    textColor: "text-green-800", darkTextColor: "dark:text-green-200",
    accentColor: "text-green-700", darkAccentColor: "dark:text-green-300"
  },
  "Self-Care Week": { 
    bgColor: "bg-blue-50", darkBgColor: "dark:bg-blue-900/20",
    borderColor: "border-blue-200", darkBorderColor: "dark:border-blue-700",
    textColor: "text-blue-800", darkTextColor: "dark:text-blue-200",
    accentColor: "text-blue-700", darkAccentColor: "dark:text-blue-300"
  }
};

// Hook to get current weekly theme colors
function useCurrentWeeklyTheme() {
  const { data: themeData } = useQuery({
    queryKey: ["/api/rotation/current"],
    queryFn: async () => {
      const response = await fetch("/api/rotation/current");
      if (!response.ok) throw new Error("Failed to fetch current theme");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Find the active weekly theme from rotation data
  const activeTheme = themeData?.weeklyThemes?.find((theme: any) => theme.isActive);
  
  // Get theme configuration or fallback to Drama Week
  const themeName = activeTheme?.name || "Drama Week";
  const themeConfig = WEEKLY_THEMES_CONFIG[themeName as keyof typeof WEEKLY_THEMES_CONFIG] || WEEKLY_THEMES_CONFIG["Drama Week"];
  
  return {
    name: themeName,
    colors: themeConfig
  };
}

const weeklyHotTopics = [
  "AI will replace most jobs in 5 years",
  "Social media is toxic for mental health", 
  "Climate change isn't being taken seriously",
  "Gen Z has it harder than previous generations",
  "Remote work is overrated"
];

export function SectionPostModal({ 
  isOpen, 
  onClose, 
  section, 
  sectionTitle,
  category = "",
  promptText = "",
  prefilledCelebrity = "",
  onPostSuccess
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
  const { celebration, triggerCelebration, completeCelebration } = useCelebration();
  const { animation: topicAnimation, triggerAnimation: triggerTopicAnimation, completeAnimation: completeTopicAnimation } = useCommunityTopicAnimation();
  const currentTheme = useCurrentWeeklyTheme();

  // Pre-fill topic when modal opens with promptText for hot-topics
  useEffect(() => {
    if (isOpen && section === "hot-topics" && promptText) {
      setTopicTitle(promptText);
    }
  }, [isOpen, section, promptText]);

  // Pre-fill celebrity name when provided for celebrity-tea
  useEffect(() => {
    if (isOpen && section === "celebrity-tea" && prefilledCelebrity) {
      setCelebrityName(prefilledCelebrity);
      // Focus on the celebrity input for better UX (after a short delay for modal to open)
      setTimeout(() => {
        const celebrityInput = document.getElementById('celebrity-name');
        if (celebrityInput) {
          celebrityInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          celebrityInput.focus();
        }
      }, 300);
    }
  }, [isOpen, section, prefilledCelebrity]);

  const createPostMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      // Invalidate all post-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/community'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/user'] });
      
      // Trigger community topic animation or regular celebration
      if (["celebrity-tea", "story-time", "hot-topics", "daily-debate", "feedback-suggestions"].includes(section)) {
        triggerTopicAnimation(section);
      } else {
        triggerCelebration(section as any);
      }
      
      // Call success callback
      onPostSuccess?.(section);
      
      // Auto-route to story category filter for story posts
      if (section === "story-time" && storyType) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('setStoryCategory', { detail: storyType }));
        }, 100);
      }
      
      // Close modal after a brief delay to allow celebration to start
      setTimeout(() => {
        handleClose();
        toast({
          title: "Post created!",
          description: "Your anonymous post has been shared with the community.",
        });
      }, 200);
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
    
    const allTags = Array.from(new Set([...selectedTags, ...manualTags])).slice(0, 5);

    // Build the post data based on section
    const postData: InsertPost = {
      content: content.trim(),
      category: getDefaultCategory(section) as any,
      tags: allTags,
      postContext: section === "daily-tea" ? "daily" : "community",
      communitySection: section === "daily-tea" ? undefined : section,
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
    if (section === "hot-topics") {
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

  // Get section-specific tag suggestions
  const getSectionTags = () => {
    switch (section) {
      case "daily-debate": return [...debateTags, ...popularTags];
      case "hot-topics": return [...hotTopicsTags, ...popularTags];
      default: return popularTags;
    }
  };

  const filteredTagSuggestions = getSectionTags().filter(tag => 
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
          {/* Daily Spill Prompt - Prominently displayed with theme colors */}
          {(category === "daily" || section === "daily-tea") && promptText && (
            <div className={`p-4 rounded-lg border-2 shadow-sm ${currentTheme.colors.bgColor} ${currentTheme.colors.darkBgColor} ${currentTheme.colors.borderColor} ${currentTheme.colors.darkBorderColor}`}>
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">☕</span>
                <p className={`text-sm font-bold ${currentTheme.colors.textColor} ${currentTheme.colors.darkTextColor}`}>Today's Prompt:</p>
              </div>
              <p className={`font-medium text-sm leading-relaxed ${currentTheme.colors.textColor} ${currentTheme.colors.darkTextColor}`}>"{promptText}"</p>
              <p className={`text-xs mt-2 italic ${currentTheme.colors.accentColor} ${currentTheme.colors.darkAccentColor}`}>
                Share your response to this prompt in your post below
              </p>
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
                  <SelectItem value="horror">😱 Horror</SelectItem>
                  <SelectItem value="funny">😂 Funny</SelectItem>
                  <SelectItem value="weird">🤔 Weird</SelectItem>
                  <SelectItem value="romantic">💕 Romantic</SelectItem>
                  <SelectItem value="embarrassing">😳 Embarrassing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hot Topics - Custom Topic Field */}
          {section === "hot-topics" && (
            <div>
              <Label htmlFor="topic-title">Select a Hot Topic</Label>
              <Select value={topicTitle} onValueChange={setTopicTitle}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose from this week's hottest discussions..." />
                </SelectTrigger>
                <SelectContent>
                  {weeklyHotTopics.map((topic, index) => (
                    <SelectItem key={index} value={topic}>
                      #{index + 1}: {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Pick one of the week's hottest topics to share your take</p>
            </div>
          )}

          {/* Daily Debate - Opinion Prompt */}
          {section === "daily-debate" && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Drop a bold opinion or debate question</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">Examples: "Is it wrong to check your partner's phone?" or "9-5 jobs are outdated — change my mind."</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Note: This post will only allow 👍/👎 voting, no comments.</p>
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
              {section === "daily-debate" ? "Your Bold Statement" : 
               section === "hot-topics" ? "Your Response" : 
               section === "story-time" ? "Tell your story..." : 
               category === "daily" ? "Your Response to Today's Prompt" : "Your Post"}
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
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            >
              {createPostMutation.isPending ? "Posting..." : "Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Celebration Animation */}
      <CelebrationAnimation
        isVisible={celebration.isVisible}
        onComplete={completeCelebration}
        type={celebration.type}
      />
      
      {/* Community Topic Animation */}
      <CommunityTopicAnimation 
        isVisible={topicAnimation.isVisible}
        topic={topicAnimation.topic}
        onComplete={completeTopicAnimation}
      />
    </Dialog>
  );
}

// Helper functions
function getDefaultCategory(section: string): string {
  switch (section) {
    case "celebrity-tea": return "gossip";
    case "story-time": return "story";
    case "hot-topics": return "hot-takes";
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
      return "Tell your story...";
    case "hot-topics":
      return "Share your take on this trending topic. What's your opinion? Why is everyone talking about it?";
    case "daily-debate":
      return "State your bold opinion or pose a debate question that will get people thinking...";
    case "tea-experiments":
      return "Describe your poll and let the community decide...";
    default:
      return "Share your thoughts...";
  }
}