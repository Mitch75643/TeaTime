import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DramaVotingProps {
  postId: string;
}

const dramaOptions = [
  { id: "wrong", label: "You were wrong", emoji: "🚩", color: "bg-red-50 text-red-700 border-red-200" },
  { id: "valid", label: "You're valid", emoji: "✨", color: "bg-green-50 text-green-700 border-green-200" },
  { id: "iconic", label: "Iconic behavior", emoji: "👑", color: "bg-purple-50 text-purple-700 border-purple-200" },
];

export function DramaVoting({ postId }: DramaVotingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userVote, setUserVote] = useState<string | null>(null);

  const { data: votes = {} } = useQuery({
    queryKey: ["/api/posts", postId, "votes"],
    enabled: !!postId,
  });

  const voteMutation = useMutation({
    mutationFn: async (voteType: string) => {
      return apiRequest(`/api/posts/${postId}/vote`, {
        method: "POST",
        body: { voteType },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "votes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Vote recorded!",
        description: "Thanks for sharing your opinion",
      });
    },
    onError: () => {
      toast({
        title: "Voting failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleVote = (voteType: string) => {
    if (userVote === voteType) return; // Prevent double voting
    setUserVote(voteType);
    voteMutation.mutate(voteType);
  };

  const totalVotes = Object.values(votes).reduce((sum: number, count) => sum + (count as number), 0);

  return (
    <div className="space-y-4 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl border-2 border-orange-200/50">
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Community Verdict 🏛️</h3>
        <p className="text-sm text-gray-600 font-medium">What do you think about this situation?</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {dramaOptions.map((option) => {
          const voteCount = votes[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isUserVote = userVote === option.id;
          
          return (
            <Button
              key={option.id}
              variant="ghost"
              className={cn(
                "relative p-4 rounded-2xl border-2 transition-all duration-300 button-hover-lift",
                isUserVote 
                  ? `${option.color} font-semibold shadow-lg transform scale-105` 
                  : "bg-white/80 text-gray-700 border-gray-200 hover:bg-white hover:shadow-md"
              )}
              onClick={() => handleVote(option.id)}
              disabled={voteMutation.isPending}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-semibold">{option.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">{voteCount}</span>
                  {totalVotes > 0 && (
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              {totalVotes > 0 && (
                <div className="absolute bottom-1 left-2 right-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      option.id === "wrong" && "bg-red-400",
                      option.id === "valid" && "bg-green-400",
                      option.id === "iconic" && "bg-purple-400"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </Button>
          );
        })}
      </div>
      
      {totalVotes > 0 && (
        <div className="text-center pt-2 border-t border-orange-200/50">
          <p className="text-xs text-gray-600 font-medium">
            {totalVotes} {totalVotes === 1 ? "person has" : "people have"} voted
          </p>
        </div>
      )}
    </div>
  );
}