import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Input } from "./input";
import { FlaskConical, BarChart3, Zap, TestTube, Beaker, Plus, RefreshCw, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface ExperimentPoll {
  id: string;
  question: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  isClose: boolean;
}

// Daily prompts that rotate every 24 hours
const dailyPrompts = [
  {
    id: "day-1",
    question: "Should I text my ex after 2 years of no contact?",
    description: "We ended things badly but I keep thinking about them. Help me decide!",
    options: [
      { id: "yes", text: "Yes, closure is important", votes: 847, percentage: 47 },
      { id: "no", text: "No, leave the past behind", votes: 953, percentage: 53 }
    ],
    totalVotes: 1800,
    isClose: true
  },
  {
    id: "day-2",
    question: "Is it weird to wear socks with sandals?",
    description: "My friend says it's a fashion crime but it's comfortable!",
    options: [
      { id: "yes", text: "Yes, total fashion crime", votes: 1203, percentage: 68 },
      { id: "no", text: "No, comfort over style", votes: 567, percentage: 32 }
    ],
    totalVotes: 1770,
    isClose: false
  },
  {
    id: "day-3", 
    question: "Should pineapple be on pizza?",
    description: "The age-old debate that divides friendships and families!",
    options: [
      { id: "yes", text: "Yes, sweet and savory!", votes: 892, percentage: 49 },
      { id: "no", text: "No, it's an abomination", votes: 928, percentage: 51 }
    ],
    totalVotes: 1820,
    isClose: true
  }
];

// Get today's prompt based on day of year
const getTodaysPrompt = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return dailyPrompts[dayOfYear % dailyPrompts.length];
};

const activePoll = getTodaysPrompt();

const pollTemplates = [
  { category: "Relationships", options: ["Yes, go for it!", "No, red flag!", "Maybe, be careful"] },
  { category: "Life Choices", options: ["Take the risk", "Play it safe", "Get more info first"] },
  { category: "Fashion/Style", options: ["Love it!", "Hate it", "It's okay"] },
  { category: "Food Decisions", options: ["Definitely try it", "Too weird for me", "Maybe once"] },
  { category: "Career Moves", options: ["Great opportunity", "Too risky", "Need more details"] }
];

interface TeaExperimentsFeaturesProps {
  onCreatePoll: (question: string, options: string[]) => void;
  onVote: (optionId: string) => void;
}

export function TeaExperimentsFeatures({ onCreatePoll, onVote }: TeaExperimentsFeaturesProps) {
  const [userVote, setUserVote] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showCommunityResults, setShowCommunityResults] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  
  const refreshCommunityResults = () => {
    // Simulate loading random community posts for today's prompt
    const mockPosts = [
      { id: 1, content: "I voted yes because everyone deserves closure, even if it's messy.", reactions: 23 },
      { id: 2, content: "No way! Moving on is the best decision you can make for your mental health.", reactions: 18 },
      { id: 3, content: "I'm in the same situation and this poll is making me think twice...", reactions: 31 },
      { id: 4, content: "Texted my ex last year and it was the worst decision ever. Don't do it!", reactions: 45 },
      { id: 5, content: "Sometimes closure helps you move forward. Just be prepared for any outcome.", reactions: 12 }
    ];
    setCommunityPosts(mockPosts.sort(() => 0.5 - Math.random()).slice(0, 3));
  };

  const handleVote = (optionId: string) => {
    setUserVote(optionId);
    setShowResults(true);
    onVote(optionId);
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };

  const addOption = () => {
    if (newOptions.length < 4) {
      setNewOptions([...newOptions, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== index));
    }
  };

  const createPoll = () => {
    if (newQuestion.trim() && newOptions.every(opt => opt.trim())) {
      onCreatePoll(newQuestion, newOptions.filter(opt => opt.trim()));
      setNewQuestion("");
      setNewOptions(["", ""]);
      setSelectedTemplate(null);
    }
  };

  const useTemplate = (templateIndex: number) => {
    setSelectedTemplate(templateIndex);
    setNewOptions([...pollTemplates[templateIndex].options]);
  };

  return (
    <div className="space-y-6">
      {/* Lab Theme Header - Smaller */}
      <div className="text-center py-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
        <div className="flex justify-center items-center gap-3 mb-1">
          <TestTube className="h-5 w-5 text-cyan-600" />
          <FlaskConical className="h-6 w-6 text-blue-600" />
          <Beaker className="h-5 w-5 text-cyan-600" />
        </div>
        <h2 className="text-lg font-bold text-blue-700 dark:text-blue-300">
          🧪 Decision Lab
        </h2>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Daily experiment • Updates every 24 hours
        </p>
      </div>

      {/* Active Experiment */}
      <Card className="border-cyan-200 dark:border-cyan-800">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
              <FlaskConical className="h-5 w-5" />
              🔬 Live Experiment
            </CardTitle>
            {activePoll.isClose && (
              <Badge className="bg-yellow-100 text-yellow-700 animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Mind-Blowing Results!
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Question - Smaller */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Today's Experiment</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                {activePoll.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                {activePoll.description}
              </p>
            </div>

            {/* Poll Options - Smaller */}
            <div className="space-y-3">
              {activePoll.options.map((option) => (
                <div key={option.id} className="space-y-2">
                  <Button
                    onClick={() => handleVote(option.id)}
                    disabled={userVote !== null}
                    className={cn(
                      "w-full justify-between h-auto p-3 text-left",
                      userVote === option.id && "ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-900/30"
                    )}
                    variant={userVote === option.id ? "default" : "outline"}
                  >
                    <div className="flex items-center gap-2">
                      <TestTube className="h-3 w-3 text-cyan-600" />
                      <span className="text-sm font-medium">{option.text}</span>
                    </div>
                    {showResults && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{option.percentage}%</span>
                        <span className="text-xs text-gray-500">({option.votes})</span>
                      </div>
                    )}
                  </Button>
                  
                  {showResults && (
                    <div className="relative">
                      <Progress 
                        value={option.percentage} 
                        className="h-3 bg-gray-200 dark:bg-gray-700"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow">
                          {option.percentage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Results Summary */}
            {showResults && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    Experiment Results
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {activePoll.totalVotes.toLocaleString()} participants • 
                  {activePoll.isClose ? " Results are surprisingly close!" : " Clear winner emerges!"}
                </p>
                {activePoll.isClose && (
                  <Badge className="mt-2 bg-yellow-100 text-yellow-700">
                    🤯 This blew my mind
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Community Results */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <BarChart3 className="h-4 w-4" />
              📊 View Community Results
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCommunityResults}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            See what others are saying about today's experiment
          </p>
        </CardHeader>
        
        <CardContent className="p-4">
          {communityPosts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                No community posts yet for today's experiment
              </p>
              <Button 
                onClick={refreshCommunityResults}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
              >
                Load Random Results
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {communityPosts.map((post) => (
                <div key={post.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-gray-500">{post.reactions} reactions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Experiment - Smaller */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-base">
            <Plus className="h-4 w-4" />
            🧪 Create Your Experiment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-4">
            {/* Question Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Your Dilemma or Question:
              </label>
              <Input
                placeholder="What decision do you need help with?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Template Options */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Quick Templates:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pollTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant={selectedTemplate === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => useTemplate(index)}
                    className="h-auto p-2 text-xs"
                  >
                    <div className="text-center">
                      <div className="font-medium">{template.category}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {template.options.length} options
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Options Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Poll Options:
              </label>
              <div className="space-y-2">
                {newOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1"
                    />
                    {newOptions.length > 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {newOptions.length < 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>

            <Button
              onClick={createPoll}
              disabled={!newQuestion.trim() || !newOptions.every(opt => opt.trim())}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              Start Experiment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}