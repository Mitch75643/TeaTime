import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Lightbulb, Bug, Zap, ArrowUp, ArrowDown, Eye, CheckCircle, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const suggestionTypes = [
  { 
    id: "bug", 
    name: "Bug Report", 
    emoji: "🐛", 
    icon: Bug, 
    color: "text-red-600",
    description: "Report issues or problems" 
  },
  { 
    id: "feature", 
    name: "Feature Request", 
    emoji: "✨", 
    icon: Zap, 
    color: "text-blue-600",
    description: "Suggest new features" 
  },
  { 
    id: "idea", 
    name: "General Idea", 
    emoji: "💡", 
    icon: Lightbulb, 
    color: "text-yellow-600",
    description: "Share your thoughts" 
  }
];

const statusLabels = [
  { id: "planned", label: "📋 Planned", color: "bg-blue-100 text-blue-700", description: "We're working on this!" },
  { id: "review", label: "👀 In Review", color: "bg-purple-100 text-purple-700", description: "Team is discussing" },
  { id: "completed", label: "✅ Completed", color: "bg-green-100 text-green-700", description: "Done and live!" },
  { id: "pending", label: "⏳ Pending", color: "bg-gray-100 text-gray-700", description: "Waiting for review" }
];

interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: string;
  upvotes: number;
  downvotes: number;
  status: string;
  author: string;
  createdAt: string;
}

const topSuggestions: Suggestion[] = [
  {
    id: "1",
    title: "Dark mode for notifications panel",
    description: "The notifications panel doesn't follow dark mode theme properly",
    type: "bug",
    upvotes: 47,
    downvotes: 2,
    status: "planned",
    author: "TechSavvy23",
    createdAt: "2 days ago"
  },
  {
    id: "2", 
    title: "Add voice messages for posts",
    description: "Sometimes text doesn't capture the emotion. Voice notes would be amazing!",
    type: "feature",
    upvotes: 34,
    downvotes: 8,
    status: "review",
    author: "VoiceQueen89",
    createdAt: "1 week ago"
  },
  {
    id: "3",
    title: "Better emoji reactions",
    description: "We need more diverse reactions beyond the basic ones",
    type: "feature", 
    upvotes: 28,
    downvotes: 3,
    status: "pending",
    author: "EmojiLover42",
    createdAt: "3 days ago"
  },
  {
    id: "4",
    title: "Profile customization options",
    description: "Let users add bio, favorite quotes, or mood status",
    type: "idea",
    upvotes: 25,
    downvotes: 5,
    status: "review",
    author: "CustomizeMe",
    createdAt: "5 days ago"
  }
];

interface SuggestionsFeaturesProps {
  onSubmitSuggestion: (suggestion: Omit<Suggestion, 'id' | 'upvotes' | 'downvotes' | 'createdAt'>) => void;
  onVote: (suggestionId: string, voteType: 'up' | 'down') => void;
}

export function SuggestionsFeatures({ onSubmitSuggestion, onVote }: SuggestionsFeaturesProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedType, setSelectedType] = useState("idea");
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});

  const handleVote = (suggestionId: string, voteType: 'up' | 'down') => {
    setUserVotes(prev => ({
      ...prev,
      [suggestionId]: prev[suggestionId] === voteType ? null : voteType
    }));
    onVote(suggestionId, voteType);
  };

  const handleSubmit = () => {
    if (newTitle.trim() && newDescription.trim()) {
      onSubmitSuggestion({
        title: newTitle,
        description: newDescription,
        type: selectedType,
        status: "pending",
        author: "You", // Will be replaced with actual username
      });
      setNewTitle("");
      setNewDescription("");
      setSelectedType("idea");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusLabels.find(s => s.id === status) || statusLabels[3];
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = suggestionTypes.find(t => t.id === type) || suggestionTypes[2];
    const Icon = typeInfo.icon;
    return <Icon className={cn("h-4 w-4", typeInfo.color)} />;
  };

  return (
    <div className="space-y-6">
      {/* Submit New Suggestion */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Plus className="h-5 w-5" />
            💡 Share Your Idea
          </CardTitle>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Help make TeaSpill even better for everyone
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Type Selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                What type of suggestion is this?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {suggestionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      variant={selectedType === type.id ? "default" : "outline"}
                      onClick={() => setSelectedType(type.id)}
                      className="h-auto p-3 justify-start"
                    >
                      <div className="text-left w-full">
                        <div className="flex items-center gap-2 font-medium">
                          <span>{type.emoji}</span>
                          <span className="text-sm">{type.name}</span>
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {type.description}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Title (be specific and clear):
              </label>
              <Input
                placeholder="What's your suggestion about?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={100}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {newTitle.length}/100
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Description (provide details):
              </label>
              <Textarea
                placeholder="Explain your suggestion in detail. Include why it would be helpful and how it might work."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="h-24 resize-none"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {newDescription.length}/500
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!newTitle.trim() || !newDescription.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Suggestion
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top Suggestions */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <ArrowUp className="h-5 w-5" />
            🏆 Top Community Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {topSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Voting */}
                  <div className="flex flex-col items-center gap-1 min-w-[50px]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(suggestion.id, 'up')}
                      className={cn(
                        "h-8 w-8 p-0",
                        userVotes[suggestion.id] === 'up' && "bg-green-100 border-green-400 text-green-600"
                      )}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {suggestion.upvotes - suggestion.downvotes}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(suggestion.id, 'down')}
                      className={cn(
                        "h-8 w-8 p-0",
                        userVotes[suggestion.id] === 'down' && "bg-red-100 border-red-400 text-red-600"
                      )}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(suggestion.type)}
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {suggestion.title}
                        </h3>
                      </div>
                      {getStatusBadge(suggestion.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {suggestion.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>by {suggestion.author}</span>
                      <span>{suggestion.createdAt}</span>
                      <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-green-500" />
                        <span>{suggestion.upvotes}</span>
                        <ArrowDown className="h-3 w-3 text-red-500 ml-2" />
                        <span>{suggestion.downvotes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Eye className="h-5 w-5" />
            📊 Status Meanings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {statusLabels.map((status) => (
              <div key={status.id} className="flex items-center gap-3">
                <Badge className={status.color}>
                  {status.label}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {status.description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}