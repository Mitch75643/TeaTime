import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { ConfettiAnimation } from "./confetti-animation";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface DramaVotingProps {
  postId: string;
}

const voteOptions = [
  {
    type: "wrong",
    emoji: "❌",
    label: "You Were Wrong",
    colorClass: "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50",
  },
  {
    type: "valid",
    emoji: "✅",
    label: "You're Valid",
    colorClass: "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700/50",
  },
  {
    type: "both_wild",
    emoji: "🔄",
    label: "You're Both Wild",
    colorClass: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700/50",
  },
  {
    type: "iconic",
    emoji: "👑",
    label: "Iconic Behavior",
    colorClass: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700/50",
  },
];

export function DramaVoting({ postId }: DramaVotingProps) {
  const [userVote, setUserVote] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevVotes, setPrevVotes] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  const { data: votes = {} } = useQuery({
    queryKey: ["/api/posts", postId, "drama-votes"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/drama-votes`);
      if (!response.ok) throw new Error("Failed to fetch votes");
      return response.json();
    },
  });

  // Check for confetti trigger (when iconic votes increase significantly)
  useEffect(() => {
    const currentIconicVotes = votes.iconic || 0;
    const prevIconicVotes = prevVotes.iconic || 0;
    
    if (currentIconicVotes > prevIconicVotes && currentIconicVotes >= 3) {
      setShowConfetti(true);
    }
    
    // Only update prevVotes if the values actually changed
    if (JSON.stringify(votes) !== JSON.stringify(prevVotes)) {
      setPrevVotes(votes);
    }
  }, [votes, prevVotes]);

  const { data: hasVoted = false } = useQuery({
    queryKey: ["/api/posts", postId, "has-voted"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/has-voted`);
      if (!response.ok) throw new Error("Failed to check vote status");
      const result = await response.json();
      return result.hasVoted;
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (voteType: string) => {
      return apiRequest("POST", "/api/drama-votes", {
        postId,
        voteType,
      });
    },
    onSuccess: (_, voteType) => {
      setUserVote(voteType);
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "drama-votes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "has-voted"] });
    },
  });

  const handleVote = (voteType: string) => {
    if (!hasVoted) {
      voteMutation.mutate(voteType);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 rounded-xl p-3 space-y-3 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center">
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Community Verdict</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">Cast your vote below</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {voteOptions.map((option) => {
            const voteCount = votes[option.type] || 0;
            const isSelected = userVote === option.type;
            const isDisabled = hasVoted && !isSelected;

            return (
              <Button
                key={option.type}
                variant="ghost"
                className={cn(
                  "h-auto p-2 rounded-lg text-center transition-all duration-200 border-2",
                  "flex flex-col items-center justify-center space-y-1",
                  "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
                  option.colorClass,
                  isSelected && "ring-2 ring-current ring-offset-1 ring-offset-white dark:ring-offset-gray-800 shadow-md scale-[1.02]",
                  isDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
                  option.type === "iconic" && voteCount >= 3 && "animate-pulse shadow-purple-200 dark:shadow-purple-900"
                )}
                onClick={() => handleVote(option.type)}
                disabled={voteMutation.isPending || isDisabled}
              >
                <div className={cn(
                  "text-xl transition-transform duration-200",
                  option.type === "iconic" && voteCount >= 3 && "animate-bounce",
                  isSelected && "scale-110"
                )}>{option.emoji}</div>
                
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold leading-tight">{option.label}</div>
                  <div className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-gray-800/50",
                    option.type === "iconic" && voteCount >= 3 && "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold"
                  )}>
                    {voteCount} vote{voteCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {hasVoted && (
          <div className="text-center pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <span className="text-green-500">✓</span>
              Thanks for voting! You can only vote once per post.
            </p>
          </div>
        )}
      </div>
      
      <ConfettiAnimation 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </>
  );
}
