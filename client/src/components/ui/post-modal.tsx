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
  defaultCategory?: string;
  defaultTags?: string[];
  promptText?: string;
  sectionTheme?: string;
}

const categories = [
  { value: "college", label: "🎓 College", color: "from-blue-500 to-indigo-600" },
  { value: "work", label: "💼 Work", color: "from-gray-600 to-slate-700" },
  { value: "relationships", label: "💕 Relationships", color: "from-pink-500 to-rose-600" },
  { value: "family", label: "👨‍👩‍👧‍👦 Family", color: "from-green-500 to-emerald-600" },
  { value: "money", label: "💰 Money", color: "from-yellow-500 to-amber-600" },
  { value: "politics", label: "🗳️ Politics", color: "from-red-500 to-red-600" },
  { value: "drama", label: "🎭 Am I the Drama?", color: "from-purple-500 to-violet-600" },
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
}: PostModalProps & { postContext?: PostModalContext }) {
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
      // Only generate new alias if we don't have one
      if (!currentAlias) {
        setCurrentAlias(generateAlias());
      }
      
      // Set default values if provided
      if (defaultCategory) {
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
      // Reset alias when modal closes
      setCurrentAlias("");
    }
  }, [isOpen, defaultCategory, defaultTags, currentAlias]);

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
    mutationFn: async (data: InsertPost & { postContext?: string; communitySection?: string }) => {
      return apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      // Invalidate all post queries to ensure posts appear everywhere they should
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
      postContext: postContext.page,
      communitySection: postContext.section,
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

  // Get context-specific styling
  const getContextTheme = () => {
    switch (postContext.page) {
      case 'daily':
        return {
          gradient: 'from-purple-500 via-pink-500 to-rose-500',
          icon: '☕',
          title: 'Daily Spill'
        };
      case 'community':
        return {
          gradient: 'from-orange-500 via-red-500 to-pink-500',
          icon: '🎤',
          title: 'Community Voice'
        };
      default:
        return {
          gradient: 'from-indigo-500 via-purple-500 to-pink-500',
          icon: '✨',
          title: 'Spill the Tea'
        };
    }
  };

  const theme = getContextTheme();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg mx-4 p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-transparent bg-clip-padding shadow-2xl">
        {/* Gradient Header */}
        <div className={`bg-gradient-to-r ${theme.gradient} p-6 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 text-6xl opacity-20 transform rotate-12 translate-x-4 -translate-y-2">
            {theme.icon}
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">{theme.title}</h2>
            <p className="text-white/80 text-sm">Share your thoughts anonymously</p>
            {hasDraft() && (
              <div className="mt-2">
                <span className="inline-flex items-center text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full">
                  📝 Draft saved
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-gray-800 dark:text-gray-200">Choose Your Vibe</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    category === cat.value
                      ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg`
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{cat.label.split(' ')[0]}</div>
                    <div className="text-sm font-medium">{cat.label.substring(cat.label.indexOf(' ') + 1)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-lg font-semibold text-gray-800 dark:text-gray-200">What's on your mind?</Label>
            <div className="relative">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={promptText ? `Responding to: "${promptText}"` : "Share your thoughts anonymously..."}
                className="h-36 resize-none border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 transition-all duration-200 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                <span className={`transition-colors ${content.length > 450 ? "text-red-500" : "text-gray-500"}`}>
                  {content.length}/500
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-3 py-2 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Posting as:</span>
                <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{currentAlias}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label htmlFor="tags" className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
              <Hash className="h-5 w-5 mr-2 text-purple-500" />
              Add Tags
            </Label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map((tag, index) => (
                  <span
                    key={tag}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg animate-in slide-in-from-bottom-2 hover:shadow-xl transition-shadow duration-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-purple-200 transition-colors rounded-full w-4 h-4 flex items-center justify-center hover:bg-white/20"
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
                placeholder="Type custom tags..."
                maxLength={50}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 transition-all duration-200"
              />
              
              {/* Tag Suggestions */}
              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl z-10 max-h-32 overflow-y-auto backdrop-blur-sm">
                  {filteredTagSuggestions.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Popular Tags Quick Select */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 6).filter(tag => !selectedTags.includes(tag)).map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    className="text-sm px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/50 dark:hover:to-pink-800/50 hover:text-purple-700 dark:hover:text-purple-300 rounded-full transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md animate-in slide-in-from-bottom-1"
                    disabled={selectedTags.length >= 5}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-2 rounded-lg">
              💡 Select up to 5 tags to help others discover your post
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || !content.trim() || !category}
              className={`w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r ${theme.gradient} text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              <div className="flex items-center justify-center space-x-2">
                {createPostMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{theme.icon}</span>
                    <span>Post Anonymously</span>
                  </>
                )}
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
