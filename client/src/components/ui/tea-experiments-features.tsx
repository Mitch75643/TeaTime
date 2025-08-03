import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Input } from "./input";
import { FlaskConical, BarChart3, Zap, TestTube, Beaker, Plus, RefreshCw, Clock, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChemistryAnimation, useChemistryAnimation } from "./chemistry-animation";

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

interface UserPoll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userAvatar: string;
  username: string;
  createdAt: Date;
}

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
  const [communityPolls, setCommunityPolls] = useState<UserPoll[]>([]);
  const [isLiveExperimentExpanded, setIsLiveExperimentExpanded] = useState(true);
  const [isCreateExperimentExpanded, setIsCreateExperimentExpanded] = useState(false);
  
  // Chemistry animation hook
  const { isVisible: isChemistryVisible, triggerAnimation, completeAnimation } = useChemistryAnimation();
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  
  const refreshCommunityResults = () => {
    // Simulate loading random community polls from "+ Create Your Experiment"
    const mockPolls: UserPoll[] = [
      {
        id: "poll-1",
        question: "Should I quit my job to travel the world for a year?",
        options: [
          { id: "yes", text: "Yes, YOLO!", votes: 234, percentage: 68 },
          { id: "no", text: "No, too risky", votes: 110, percentage: 32 }
        ],
        totalVotes: 344,
        userAvatar: "🌟",
        username: "AdventureDreamer23",
        createdAt: new Date()
      },
      {
        id: "poll-2", 
        question: "Is it weird to bring my own snacks to the movie theater?",
        options: [
          { id: "weird", text: "Yes, totally weird", votes: 89, percentage: 22 },
          { id: "smart", text: "No, you're saving money!", votes: 201, percentage: 50 },
          { id: "depends", text: "Depends on the snack", votes: 112, percentage: 28 }
        ],
        totalVotes: 402,
        userAvatar: "🍿",
        username: "MovieBudgetHack",
        createdAt: new Date()
      },
      {
        id: "poll-3",
        question: "Should I tell my roommate they're a terrible cook?",
        options: [
          { id: "yes", text: "Yes, honesty is best", votes: 156, percentage: 41 },
          { id: "no", text: "No, too harsh", votes: 98, percentage: 26 },
          { id: "gentle", text: "Suggest cooking together", votes: 124, percentage: 33 }
        ],
        totalVotes: 378,
        userAvatar: "👨‍🍳",
        username: "DiplomaticFoodie",
        createdAt: new Date()
      }
    ];
    setCommunityPolls(mockPolls.sort(() => 0.5 - Math.random()).slice(0, 2));
  };

  const handlePollVote = (pollId: string, optionId: string) => {
    if (userVotes[pollId]) return; // Already voted
    
    setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
    
    // Update poll votes
    setCommunityPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const updatedOptions = poll.options.map(option => {
          if (option.id === optionId) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });
        
        const newTotalVotes = poll.totalVotes + 1;
        const optionsWithPercentages = updatedOptions.map(option => ({
          ...option,
          percentage: Math.round((option.votes / newTotalVotes) * 100)
        }));
        
        return {
          ...poll,
          options: optionsWithPercentages,
          totalVotes: newTotalVotes
        };
      }
      return poll;
    }));
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
      // Trigger chemistry animation first
      triggerAnimation();
      
      // Create new poll and add to community results
      const newPoll: UserPoll = {
        id: `poll-${Date.now()}`,
        question: newQuestion.trim(),
        options: newOptions.filter(opt => opt.trim()).map((text, index) => ({
          id: `option-${index}`,
          text: text.trim(),
          votes: 0,
          percentage: 0
        })),
        totalVotes: 0,
        userAvatar: "🧪", // Could get from user context
        username: "You",
        createdAt: new Date()
      };
      
      setCommunityPolls(prev => [newPoll, ...prev]);
      
      // Reset form and collapse create section after animation starts
      setTimeout(() => {
        setNewQuestion("");
        setNewOptions(["", ""]);
        setSelectedTemplate(null);
        setIsCreateExperimentExpanded(false);
      }, 500);
      
      // Scroll to Community Results section after animation
      setTimeout(() => {
        const communityResultsElement = document.querySelector('[data-section="community-results"]');
        if (communityResultsElement) {
          communityResultsElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 2100); // After animation completes
      
      // Don't call onCreatePoll to avoid opening modal
      // onCreatePoll(newQuestion, newOptions.filter(opt => opt.trim()));
    }
  };

  const useTemplate = (templateIndex: number) => {
    setSelectedTemplate(templateIndex);
    setNewOptions([...pollTemplates[templateIndex].options]);
  };

  return (
    <div className="space-y-4">
      {/* Lab Theme Header - Smaller & Responsive */}
      <div className="text-center py-2 px-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
        <div className="flex justify-center items-center gap-2 mb-1">
          <TestTube className="h-4 w-4 text-cyan-600" />
          <FlaskConical className="h-5 w-5 text-blue-600" />
          <Beaker className="h-4 w-4 text-cyan-600" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300">
          🧪 Decision Lab
        </h2>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Daily experiment • Updates every 24 hours
        </p>
      </div>

      {/* Live Experiment - Collapsible */}
      <Card className="border-cyan-200 dark:border-cyan-800">
        <CardHeader 
          className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 cursor-pointer hover:bg-opacity-80 transition-colors"
          onClick={() => setIsLiveExperimentExpanded(!isLiveExperimentExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 text-sm sm:text-base">
              <FlaskConical className="h-4 w-4" />
              🔬 Live Experiment
            </CardTitle>
            <div className="flex items-center gap-2">
              {activePoll.isClose && (
                <Badge className="bg-yellow-100 text-yellow-700 animate-pulse text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Mind-Blowing!
                </Badge>
              )}
              {isLiveExperimentExpanded ? 
                <ChevronUp className="h-4 w-4 text-cyan-700 dark:text-cyan-300" /> : 
                <ChevronDown className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              }
            </div>
          </div>
        </CardHeader>
        
        {isLiveExperimentExpanded && (
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3">
              {/* Question - Smaller & Responsive */}
              <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Today's Experiment</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {activePoll.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  {activePoll.description}
                </p>
              </div>

              {/* Poll Options - Smaller & Responsive */}
              <div className="space-y-2">
                {activePoll.options.map((option) => (
                  <div key={option.id} className="space-y-1">
                    <Button
                      onClick={() => handleVote(option.id)}
                      disabled={userVote !== null}
                      className={cn(
                        "w-full justify-between h-auto p-2 sm:p-3 text-left text-xs sm:text-sm",
                        userVote === option.id && "ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-900/30"
                      )}
                      variant={userVote === option.id ? "default" : "outline"}
                    >
                      <div className="flex items-center gap-2">
                        <TestTube className="h-3 w-3 text-cyan-600 flex-shrink-0" />
                        <span className="font-medium">{option.text}</span>
                      </div>
                      {showResults && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-xs sm:text-sm font-medium">{option.percentage}%</span>
                          <span className="text-xs text-gray-500">({option.votes})</span>
                        </div>
                      )}
                    </Button>
                  
                    {showResults && (
                      <div className="relative">
                        <Progress 
                          value={option.percentage} 
                          className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700"
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

              {/* Results Summary - Smaller & Responsive */}
              {showResults && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-2 sm:p-3 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                      Experiment Results
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                    {activePoll.totalVotes.toLocaleString()} participants • 
                    {activePoll.isClose ? " Results are surprisingly close!" : " Clear winner emerges!"}
                  </p>
                  {activePoll.isClose && (
                    <Badge className="mt-2 bg-yellow-100 text-yellow-700 text-xs">
                      🤯 This blew my mind
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Create New Experiment - Collapsible & Smaller */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader 
          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 cursor-pointer hover:bg-opacity-80 transition-colors"
          onClick={() => setIsCreateExperimentExpanded(!isCreateExperimentExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-sm sm:text-base">
              <Plus className="h-4 w-4" />
              🧪 Create Your Experiment
            </CardTitle>
            {isCreateExperimentExpanded ? 
              <ChevronUp className="h-4 w-4 text-purple-700 dark:text-purple-300" /> : 
              <ChevronDown className="h-4 w-4 text-purple-700 dark:text-purple-300" />
            }
          </div>
        </CardHeader>
        
        {isCreateExperimentExpanded && (
          <CardContent className="p-2 sm:p-3">
            <div className="space-y-3">
              {/* Question Input - Smaller */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Your Dilemma or Question:
                </label>
                <Input
                  placeholder="What decision do you need help with?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="text-xs sm:text-sm w-full"
                />
            </div>

              {/* Template Selection - Smaller */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Quick Templates:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                  {pollTemplates.map((template, index) => (
                    <Button
                      key={index}
                      variant={selectedTemplate === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => useTemplate(index)}
                      className="text-xs h-auto p-1 sm:p-2"
                    >
                      {template.category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Options - Smaller */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Answer Options:
                </label>
                <div className="space-y-2">
                  {newOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 text-xs sm:text-sm"
                      />
                      {newOptions.length > 2 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-500 px-2"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  {newOptions.length < 4 && (
                    <Button variant="outline" size="sm" onClick={addOption} className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>
              </div>

              {/* Create Button - Smaller */}
              <Button 
                onClick={createPoll}
                disabled={!newQuestion.trim() || !newOptions.every(opt => opt.trim())}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs sm:text-sm"
              >
                <TestTube className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Launch Experiment
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* View Community Results - Always Visible & Smaller */}
      <Card className="border-green-200 dark:border-green-800" data-section="community-results">
        <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm sm:text-base">
              <BarChart3 className="h-4 w-4" />
              📊 Community Results
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCommunityResults}
              className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
            See what others are saying about today's experiment
          </p>
        </CardHeader>
        
        <CardContent className="p-2 sm:p-3">
          {communityPolls.length === 0 ? (
            <div className="text-center py-4 sm:py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-3 text-xs sm:text-sm">
                No community experiments yet
              </p>
              <Button 
                onClick={refreshCommunityResults}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white text-xs sm:text-sm"
              >
                Load Random Experiments
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {communityPolls.map((poll) => (
                <Card key={poll.id} className={cn(
                  "border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
                  poll.username === "You" && "ring-2 ring-purple-400 ring-opacity-50"
                )}>
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-lg">{poll.userAvatar}</div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                          {poll.username}
                          {poll.username === "You" && (
                            <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1 rounded">Your experiment</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {poll.totalVotes} votes
                        </p>
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                      {poll.question}
                    </h3>
                  </CardHeader>
                  
                  <CardContent className="pt-0 p-2 sm:p-3">
                    <div className="space-y-2">
                      {poll.options.map((option) => (
                        <div key={option.id}>
                          <Button
                            onClick={() => handlePollVote(poll.id, option.id)}
                            disabled={userVotes[poll.id] !== undefined || poll.username === "You"}
                            className={cn(
                              "w-full justify-between h-auto p-2 sm:p-3 text-left text-xs sm:text-sm",
                              userVotes[poll.id] === option.id && "ring-2 ring-purple-500 bg-purple-100 dark:bg-purple-900/30",
                              (userVotes[poll.id] || poll.username === "You") && "cursor-default",
                              poll.username === "You" && "opacity-75"
                            )}
                            variant={userVotes[poll.id] === option.id ? "default" : "outline"}
                          >
                            <div className="flex items-center gap-2">
                              <TestTube className="h-3 w-3 text-purple-600 flex-shrink-0" />
                              <span className="font-medium">{option.text}</span>
                            </div>
                            {(userVotes[poll.id] || poll.username === "You") && (
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-xs sm:text-sm font-medium">{option.percentage}%</span>
                                <span className="text-xs text-gray-500">({option.votes})</span>
                              </div>
                            )}
                          </Button>
                          
                          {(userVotes[poll.id] || poll.username === "You") && (
                            <div className="mt-1">
                              <Progress 
                                value={option.percentage} 
                                className="h-2 bg-gray-200 dark:bg-gray-700"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {userVotes[poll.id] && (
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Thanks for voting! Results locked in.
                        </p>
                      </div>
                    )}
                    
                    {poll.username === "You" && (
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-purple-600 dark:text-purple-400 text-center font-medium">
                          Your experiment is live! Others can vote on it.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Chemistry Animation */}
      <ChemistryAnimation 
        isVisible={isChemistryVisible}
        onComplete={completeAnimation}
      />
    </div>
  );
}