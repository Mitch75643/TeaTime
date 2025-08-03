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

export function SuggestionsFeatures({ onSubmitSuggestion, onVote }: SuggestionsFeaturesProps) {
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
    
    // Reset form
    setTitle("");
    setDescription("");
    setRating(0);
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
    <div className="space-y-4 mt-6">
      {/* Category Selection - Always Visible */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            What would you like to share?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {suggestionCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "w-full justify-start h-auto p-3 text-left",
                category.color,
                selectedCategory === category.id ? category.bgColor : "",
                selectedCategory === category.id ? category.textColor : ""
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{category.emoji}</span>
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
        <div className="mt-4">
          <Card className={cn("border-2", selectedCategoryData.color)}>
            <CardHeader className={cn("pb-3", selectedCategoryData.bgColor)}>
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-sm font-medium flex items-center gap-2", selectedCategoryData.textColor)}>
                  <span className="text-base">{selectedCategoryData.emoji}</span>
                  {selectedCategoryData.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs"
                >
                  ← Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
            {/* Title Input */}
            <div>
              <Input
                placeholder={selectedCategoryData.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Rating for Feedback */}
            {selectedCategory === "feedback" && (
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Rate your experience:
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={cn(
                          "text-xl transition-all duration-200 hover:scale-110",
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
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
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
                className="text-sm min-h-[60px] resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={!title.trim() || !description.trim() || (selectedCategory === "feedback" && rating === 0)}
              className={cn(
                "w-full text-sm",
                selectedCategory === "bug" && "bg-red-500 hover:bg-red-600",
                selectedCategory === "feature" && "bg-blue-500 hover:bg-blue-600", 
                selectedCategory === "feedback" && "bg-yellow-500 hover:bg-yellow-600"
              )}
            >
              <Send className="h-3 w-3 mr-2" />
              Submit {selectedCategoryData.name}
            </Button>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Community Suggestions Feed */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🏆 Top Community Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className={cn(
                "border hover:shadow-md transition-shadow duration-200", 
                getCategoryBadgeStyle(suggestion.category), 
                "border-opacity-40"
              )}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header with category badge and rating/votes */}
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className={cn("text-xs shrink-0", getCategoryBadgeStyle(suggestion.category))}>
                        {suggestionCategories.find(cat => cat.id === suggestion.category)?.emoji} {suggestion.category}
                      </Badge>
                      <div className="flex items-center gap-2 ml-2">
                        {suggestion.rating && (
                          <div className="flex">
                            {[...Array(suggestion.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(suggestion.id)}
                          className={cn(
                            "h-6 px-2 text-xs shrink-0",
                            userVotes[suggestion.id] && "text-blue-600 bg-blue-50"
                          )}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {suggestion.upvotes + (userVotes[suggestion.id] ? 1 : 0)}
                        </Button>
                      </div>
                    </div>

                    {/* Title - Bold and properly sized */}
                    <h3 className="font-bold text-sm leading-tight text-gray-900 dark:text-gray-100">
                      {suggestion.title}
                    </h3>

                    {/* Description preview - Smaller and truncated */}
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
                      {suggestion.description.length > 80 
                        ? `${suggestion.description.substring(0, 80)}...` 
                        : suggestion.description
                      }
                    </p>

                    {/* Footer with author */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          by {suggestion.author}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {suggestion.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}