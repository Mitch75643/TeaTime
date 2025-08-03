import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Input } from "./input";
import { Vote, ThumbsUp, ThumbsDown, Users, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebateOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface DailyDebate {
  id: string;
  question: string;
  description: string;
  options: DebateOption[];
  totalVotes: number;
  timeLeft: string;
  category: string;
}

const todaysDebate: DailyDebate = {
  id: "debate-001",
  question: "Should social media have age restrictions like alcohol?",
  description: "With growing concerns about mental health and digital addiction, should platforms like Instagram and TikTok require users to be 21+?",
  options: [
    { id: "yes", text: "Yes, protect young minds", votes: 1247, percentage: 64 },
    { id: "no", text: "No, freedom of access", votes: 701, percentage: 36 }
  ],
  totalVotes: 1948,
  timeLeft: "14h 32m",
  category: "Technology & Society"
};

const upcomingDebates = [
  "Is remote work better for work-life balance?",
  "Should college be free for everyone?", 
  "Are influencers real entrepreneurs?",
  "Is social media making us more lonely?",
  "Should AI art be considered real art?"
];

interface DailyDebateFeaturesProps {
  onVote: (optionId: string) => void;
  onCreateDebate: (question: string) => void;
}

export function DailyDebateFeatures({ onVote, onCreateDebate }: DailyDebateFeaturesProps) {
  const [userVote, setUserVote] = useState<string | null>(null);
  const [newDebateQuestion, setNewDebateQuestion] = useState("");
  const [submittedQuestions, setSubmittedQuestions] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleVote = (optionId: string) => {
    setUserVote(optionId);
    setShowResults(true);
    onVote(optionId);
  };

  const submitDebateQuestion = () => {
    if (newDebateQuestion.trim()) {
      setSubmittedQuestions([...submittedQuestions, newDebateQuestion.trim()]);
      setNewDebateQuestion("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Big Debate */}
      <Card className="border-indigo-200 dark:border-indigo-800">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <Vote className="h-5 w-5" />
              🗳️ Today's Big Debate
            </CardTitle>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <Badge className="bg-indigo-100 text-indigo-700">
                {todaysDebate.timeLeft} left
              </Badge>
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-700 w-fit">
            {todaysDebate.category}
          </Badge>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Question */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {todaysDebate.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {todaysDebate.description}
              </p>
            </div>

            {/* Voting Options */}
            <div className="space-y-4">
              {todaysDebate.options.map((option) => (
                <div key={option.id} className="space-y-2">
                  <Button
                    onClick={() => handleVote(option.id)}
                    disabled={userVote !== null}
                    className={cn(
                      "w-full justify-between h-auto p-4 text-left",
                      userVote === option.id && "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30",
                      userVote === null && "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    variant={userVote === option.id ? "default" : "outline"}
                  >
                    <div className="flex items-center gap-3">
                      {option.id === "yes" ? (
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <ThumbsDown className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">{option.text}</span>
                    </div>
                    {showResults && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{option.percentage}%</span>
                        <span className="text-xs text-gray-500">({option.votes} votes)</span>
                      </div>
                    )}
                  </Button>
                  
                  {showResults && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-500",
                          option.id === "yes" ? "bg-green-500" : "bg-red-500"
                        )}
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Vote Stats */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">{todaysDebate.totalVotes.toLocaleString()} total votes</span>
              </div>
              {userVote && (
                <Badge className="bg-green-100 text-green-700">
                  ✅ You voted {userVote === "yes" ? "Yes" : "No"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggest Future Debates */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Plus className="h-5 w-5" />
            💭 Suggest Tomorrow's Debate
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="What should we debate tomorrow?"
                value={newDebateQuestion}
                onChange={(e) => setNewDebateQuestion(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && submitDebateQuestion()}
              />
              <Button
                onClick={submitDebateQuestion}
                disabled={!newDebateQuestion.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
            
            {submittedQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Submitted Questions:
                </p>
                {submittedQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                  >
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      Pending
                    </Badge>
                    <span className="text-sm text-purple-600 dark:text-purple-400">
                      {question}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Debates Preview */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            📅 Coming Up This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {upcomingDebates.map((debate, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => onCreateDebate(debate)}
              >
                <Badge variant="outline" className="text-xs">
                  Day {index + 2}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {debate}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}