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
    label: "You were wrong",
    colorClass: "bg-red-100 hover:bg-red-200 text-red-800 border-red-300",
  },
  {
    type: "valid",
    emoji: "✅",
    label: "You're valid",
    colorClass: "bg-green-100 hover:bg-green-200 text-green-800 border-green-300",
  },
  {
    type: "both_wild",
    emoji: "🤪",
    label: "You're both wild",
    colorClass: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300",
  },
  {
    type: "iconic",
    emoji: "👑",
    label: "Iconic behavior",
    colorClass: "bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300",
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
    
    setPrevVotes(votes);
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
      <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 space-y-3">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">Community Verdict</h4>
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
                  "p-3 rounded-lg text-center transition-all border-2 border-transparent hover:scale-105",
                  option.colorClass,
                  isSelected && "border-current shadow-lg",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  option.type === "iconic" && voteCount >= 3 && "animate-pulse"
                )}
                onClick={() => handleVote(option.type)}
                disabled={voteMutation.isPending || isDisabled}
              >
                <div className={cn(
                  "text-2xl mb-1 transition-transform",
                  option.type === "iconic" && voteCount >= 3 && "animate-bounce"
                )}>{option.emoji}</div>
                <div className="text-xs font-medium">{option.label}</div>
                <div className={cn(
                  "text-xs mt-1 opacity-75 font-medium",
                  option.type === "iconic" && voteCount >= 3 && "text-purple-600 font-bold"
                )}>{voteCount} votes</div>
              </Button>
            );
          })}
        </div>
        {hasVoted && (
          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
            Thanks for voting! You can only vote once per post.
          </p>
        )}
      </div>
      
      <ConfettiAnimation 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </>
  );
}
