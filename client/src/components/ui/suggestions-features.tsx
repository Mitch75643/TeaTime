import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Bug, 
  Sparkles, 
  MessageSquare,
  Plus, 
  ThumbsUp, 
  Star,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

type SuggestionCategory = "bug" | "feature" | "feedback";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: SuggestionCategory;
  upvotes: number;
  author: string;
  createdAt: Date;
  rating?: number; // For feedback type
  hasVoted?: boolean;
}

interface SuggestionsFeaturesProps {
  onSubmitSuggestion: (suggestion: Omit<Suggestion, 'id' | 'upvotes' | 'createdAt' | 'hasVoted'>) => void;
  onVote: (suggestionId: string, voteType: "up") => void;
  onCelebrationTrigger?: (type: "bug-report" | "feature-request" | "general-feedback") => void;
}

const suggestionCategories = [
  {
    id: "bug" as const,
    name: "Bug Report",
    emoji: "🐞",
    icon: Bug,
    color: "border-red-200 hover:border-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    textColor: "text-red-600 dark:text-red-400",
    titlePlaceholder: "What's the bug and where did it happen?",
    descriptionPlaceholder: "Describe exactly what went wrong and where. Be as specific as you can."
  },
  {
    id: "feature" as const,
    name: "Feature Request", 
    emoji: "✨",
    icon: Sparkles,
    color: "border-blue-200 hover:border-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-600 dark:text-blue-400",
    titlePlaceholder: "What should we add?",
    descriptionPlaceholder: "Describe the feature, how it would work, and why it would be useful."
  },
  {
    id: "feedback" as const,
    name: "Feedback",
    emoji: "💬", 
    icon: MessageSquare,
    color: "border-yellow-200 hover:border-yellow-300",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    textColor: "text-yellow-600 dark:text-yellow-400",
    titlePlaceholder: "What are your thoughts or feedback?",
    descriptionPlaceholder: "Share your experience, suggestions, or general thoughts about TeaSpill."
  }
];

// Sample suggestions for display
const sampleSuggestions: Suggestion[] = [
  {
    id: "1",
    title: "Dark mode notification bug",
    description: "Notifications don't follow dark mode properly...",
    category: "bug",
    upvotes: 47,
    author: "TechUser23",
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "2", 
    title: "Add voice messages",
    description: "Voice notes would capture emotion better...",
    category: "feature",
    upvotes: 34,
    author: "VoiceQueen89",
    createdAt: new Date("2025-01-02"),
  },
  {
    id: "3",
    title: "App feels really smooth",
    description: "Great job on the latest updates!",
    category: "feedback",
    upvotes: 28,
    author: "HappyUser42",
    createdAt: new Date("2025-01-03"),
    rating: 5
  }
];

export function SuggestionsFeatures({ onSubmitSuggestion, onVote, onCelebrationTrigger }: SuggestionsFeaturesProps) {
  const [selectedCategory, setSelectedCategory] = useState<SuggestionCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [suggestions] = useState<Suggestion[]>(sampleSuggestions);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});

  const handleCategoryClick = (categoryId: SuggestionCategory) => {
    // Toggle: if same category is clicked, close it; otherwise open the new one
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const selectedCategoryData = suggestionCategories.find(cat => cat.id === selectedCategory);

  const handleSubmit = () => {
    if (!selectedCategory || !title.trim() || !description.trim()) return;
    
    const newSuggestion = {
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      author: "You",
      rating: selectedCategory === "feedback" ? rating : undefined
    };
    
    onSubmitSuggestion(newSuggestion);
    
    // Trigger celebration based on category
    if (onCelebrationTrigger) {
      switch (selectedCategory) {
        case "bug":
          onCelebrationTrigger("bug-report");
          break;
        case "feature":
          onCelebrationTrigger("feature-request");
          break;
        case "feedback":
          onCelebrationTrigger("general-feedback");
          break;
      }
    }
    
    // Reset form
    setTitle("");
    setDescription("");
    setRating(0);
    setHoverRating(0);
    setSelectedCategory(null);
  };

  const handleVote = (suggestionId: string) => {
    setUserVotes(prev => ({
      ...prev,
      [suggestionId]: !prev[suggestionId]
    }));
    onVote(suggestionId, "up");
  };

  const getCategoryBadgeStyle = (category: SuggestionCategory) => {
    switch (category) {
      case "bug":
        return "bg-red-100 text-red-700 border-red-200";
      case "feature":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "feedback":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Selection - Always Visible */}
      <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200 text-center">
            What would you like to share?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {suggestionCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "w-full justify-start h-auto p-4 text-left transition-all",
                category.color,
                selectedCategory === category.id ? category.bgColor : "hover:bg-gray-50 dark:hover:bg-gray-800",
                selectedCategory === category.id ? category.textColor : ""
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.emoji}</span>
                <div>
                  <p className={cn("font-medium text-sm", 
                    selectedCategory === category.id ? category.textColor : category.textColor
                  )}>
                    {category.name}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Selected Category Form */}
      {selectedCategory && selectedCategoryData && (
        <div className="mt-6">
          <Card className={cn("border-2 shadow-lg", selectedCategoryData.color)}>
            <CardHeader className={cn("pb-4", selectedCategoryData.bgColor)}>
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-base font-semibold flex items-center gap-2", selectedCategoryData.textColor)}>
                  <span className="text-xl">{selectedCategoryData.emoji}</span>
                  {selectedCategoryData.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm hover:bg-white/20"
                >
                  ← Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Title Input */}
              <div>
                <Input
                  placeholder={selectedCategoryData.titlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-sm p-3 border-2 focus:border-gray-400"
                />
              </div>

              {/* Rating for Feedback */}
              {selectedCategory === "feedback" && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Rate your experience:
                  </p>
                  <div className="flex justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = star <= (hoverRating || rating);
                      return (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={cn(
                            "text-2xl transition-all duration-200 hover:scale-125 p-1",
                            isActive 
                              ? "text-yellow-400 drop-shadow-sm" 
                              : "text-gray-300 hover:text-yellow-200"
                          )}
                        >
                          {isActive ? "★" : "☆"}
                        </button>
                      );
                    })}
                  </div>
                  {rating > 0 && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                      {rating === 1 && "Poor experience"}
                      {rating === 2 && "Below average"}
                      {rating === 3 && "Average"}
                      {rating === 4 && "Good experience"}
                      {rating === 5 && "Excellent experience"}
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <Textarea
                  placeholder={selectedCategoryData.descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-sm min-h-[80px] p-3 border-2 focus:border-gray-400 resize-none"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button 
                  onClick={handleSubmit}
                  disabled={!title.trim() || !description.trim() || (selectedCategory === "feedback" && rating === 0)}
                  className={cn(
                    "w-full text-sm py-3 font-medium",
                    selectedCategory === "bug" && "bg-red-500 hover:bg-red-600",
                    selectedCategory === "feature" && "bg-blue-500 hover:bg-blue-600", 
                    selectedCategory === "feedback" && "bg-yellow-500 hover:bg-yellow-600"
                  )}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit {selectedCategoryData.name}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );
}