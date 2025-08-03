import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Input } from "./input";
import { FlaskConical, BarChart3, Zap, TestTube, Beaker, Plus } from "lucide-react";
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

const activePoll: ExperimentPoll = {
  id: "exp-001",
  question: "Should I text my ex after 2 years of no contact?",
  description: "We ended things badly but I keep thinking about them. Help me decide!",
  options: [
    { id: "yes", text: "Yes, closure is important", votes: 847, percentage: 47 },
    { id: "no", text: "No, leave the past behind", votes: 953, percentage: 53 }
  ],
  totalVotes: 1800,
  isClose: true
};

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
      {/* Lab Theme Header */}
      <div className="text-center py-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
        <div className="flex justify-center items-center gap-4 mb-2">
          <TestTube className="h-6 w-6 text-cyan-600" />
          <FlaskConical className="h-8 w-8 text-blue-600" />
          <Beaker className="h-6 w-6 text-cyan-600" />
        </div>
        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300">
          🧪 Welcome to the Decision Lab
        </h2>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Where community wisdom meets your dilemmas
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
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Question */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {activePoll.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {activePoll.description}
              </p>
            </div>

            {/* Poll Options */}
            <div className="space-y-4">
              {activePoll.options.map((option) => (
                <div key={option.id} className="space-y-2">
                  <Button
                    onClick={() => handleVote(option.id)}
                    disabled={userVote !== null}
                    className={cn(
                      "w-full justify-between h-auto p-4 text-left",
                      userVote === option.id && "ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-900/30"
                    )}
                    variant={userVote === option.id ? "default" : "outline"}
                  >
                    <div className="flex items-center gap-3">
                      <TestTube className="h-4 w-4 text-cyan-600" />
                      <span className="font-medium">{option.text}</span>
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

      {/* Create New Experiment */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Plus className="h-5 w-5" />
            🧪 Create Your Experiment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
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