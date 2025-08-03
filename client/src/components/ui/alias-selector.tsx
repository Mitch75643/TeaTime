import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Shuffle, Check } from "lucide-react";
import { generateRandomUsername, type UserAlias } from "@/lib/alias-generator";
import { cn } from "@/lib/utils";

interface AliasSelectorProps {
  currentAlias: UserAlias;
  onSelect: (username: UserAlias) => void;
  className?: string;
}

export function AliasSelector({ currentAlias, onSelect, className }: AliasSelectorProps) {
  const [previewUsername, setPreviewUsername] = useState<UserAlias>(currentAlias);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNew = () => {
    setIsGenerating(true);
    // Add small delay for better UX
    setTimeout(() => {
      const newUsername = generateRandomUsername();
      setPreviewUsername(newUsername);
      setIsGenerating(false);
    }, 200);
  };

  const keepUsername = () => {
    onSelect(previewUsername);
  };

  const isCurrentUsername = previewUsername.alias === currentAlias.alias;

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Your TeaSpill Username</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This is how you'll appear to others (your identity stays anonymous)
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current/Preview Username Display */}
        <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {previewUsername.alias}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {previewUsername.hasEmoji ? "With emoji style" : "Clean style"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateNew}
            disabled={isGenerating}
            className="flex-1"
          >
            <Shuffle className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
            {isGenerating ? "Generating..." : "Generate New"}
          </Button>
          
          <Button
            onClick={keepUsername}
            disabled={isCurrentUsername}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Check className="h-4 w-4 mr-2" />
            {isCurrentUsername ? "Current" : "Keep This"}
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          You can change your username anytime from your profile settings
        </p>
      </CardContent>
    </Card>
  );
}