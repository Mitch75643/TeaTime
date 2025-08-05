import { useState, useRef, useEffect } from "react";
import { Hash, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface EnhancedHashtagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function EnhancedHashtagInput({
  selectedTags,
  onTagsChange,
  suggestions = [],
  placeholder = "Add tags...",
  label = "Tags (Optional)",
  className
}: EnhancedHashtagInputProps) {
  const [tagsInput, setTagsInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_TAGS = 5;
  const isAtLimit = selectedTags.length >= MAX_TAGS;

  // Auto-add # prefix
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Auto-add # if not present and user is typing
    if (value && !value.startsWith("#")) {
      value = "#" + value;
    }
    
    setTagsInput(value);
  };

  // Handle adding tags
  const addTag = (tag: string) => {
    if (isAtLimit) return;
    
    // Ensure tag starts with #
    const formattedTag = tag.startsWith("#") ? tag : "#" + tag;
    
    // Check if tag already exists (case insensitive)
    const existingTag = selectedTags.find(
      existingTag => existingTag.toLowerCase() === formattedTag.toLowerCase()
    );
    
    if (!existingTag && formattedTag.length > 1) {
      onTagsChange([...selectedTags, formattedTag]);
    }
    
    setTagsInput("");
    setShowSuggestions(false);
    
    // Keep input focused for next tag
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  // Handle removing tags
  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
    
    // Re-enable input and focus it
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  // Handle key press events
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      if (tagsInput.trim()) {
        addTag(tagsInput.trim());
      }
    }
  };

  // Filter suggestions based on input
  const filteredSuggestions = suggestions
    .filter(tag => {
      const searchTerm = tagsInput.replace("#", "").toLowerCase();
      return searchTerm && tag.toLowerCase().includes(searchTerm) && 
             !selectedTags.some(selected => selected.toLowerCase() === tag.toLowerCase());
    })
    .slice(0, 6);

  // Auto-focus and add # when input is focused
  const handleFocus = () => {
    if (!isAtLimit) {
      setShowSuggestions(true);
      // Auto-add # if input is empty
      if (!tagsInput) {
        setTagsInput("#");
      }
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="hashtag-input">{label}</Label>
      
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200 transition-colors"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Input Field */}
      <div className="relative">
        <Input
          ref={inputRef}
          id="hashtag-input"
          value={tagsInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isAtLimit ? "Tag limit reached" : placeholder}
          disabled={isAtLimit}
          className={cn(
            "pr-8 transition-all duration-200",
            isAtLimit && "opacity-50 cursor-not-allowed"
          )}
        />
        <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Limit Warning Message */}
      {isAtLimit && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded flex items-center gap-1">
          <span className="text-amber-500">❗</span>
          You've reached the 5-tag limit. Remove one to add another.
        </div>
      )}

      {/* Tag Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && !isAtLimit && (
        <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-32 overflow-y-auto z-10">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Tag Counter */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
        {selectedTags.length}/{MAX_TAGS} tags
      </div>
    </div>
  );
}