import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Phone, MessageCircle, ExternalLink, X } from "lucide-react";
import type { ModerationResponse } from "@shared/schema";

interface MentalHealthSupportProps {
  moderationResponse: {
    severityLevel: 1 | 2 | 3;
    supportMessage?: string;
    resources?: Array<{
      title: string;
      url: string;
      phone?: string;
    }>;
  };
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
}

export function MentalHealthSupport({ 
  moderationResponse, 
  isOpen, 
  onClose, 
  onAcknowledge 
}: MentalHealthSupportProps) {
  const [showFullResources, setShowFullResources] = useState(false);
  
  const getSeverityColors = (level: 1 | 2 | 3) => {
    switch (level) {
      case 3: return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950";
      case 2: return "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950";
      case 1: return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950";
    }
  };

  const getSeverityIcon = (level: 1 | 2 | 3) => {
    switch (level) {
      case 3: return <Heart className="h-6 w-6 text-red-500" />;
      case 2: return <Heart className="h-6 w-6 text-orange-500" />;
      case 1: return <Heart className="h-6 w-6 text-blue-500" />;
    }
  };

  const handleResourceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon(moderationResponse.severityLevel)}
            We Care About You
          </DialogTitle>
        </DialogHeader>
        
        <div className={`rounded-lg border p-4 ${getSeverityColors(moderationResponse.severityLevel)}`}>
          {moderationResponse.supportMessage && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              {moderationResponse.supportMessage}
            </p>
          )}
          
          {moderationResponse.resources && moderationResponse.resources.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Immediate Support Available
              </h4>
              
              <div className="space-y-2">
                {(showFullResources ? moderationResponse.resources : moderationResponse.resources.slice(0, 2)).map((resource, index) => (
                  <div 
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {resource.title}
                        </h5>
                        {resource.phone && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-mono mt-1">
                            {resource.phone}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResourceClick(resource.url)}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {moderationResponse.resources.length > 2 && !showFullResources && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullResources(true)}
                    className="w-full text-sm"
                  >
                    Show {moderationResponse.resources.length - 2} more resources
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Your privacy matters. This message is only visible to you and doesn't affect your post.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={onAcknowledge}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                I understand
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick access component for mental health resources
export function MentalHealthQuickAccess() {
  const [isOpen, setIsOpen] = useState(false);
  
  const emergencyResources = [
    {
      title: "988 Suicide & Crisis Lifeline",
      url: "https://988lifeline.org",
      phone: "988"
    },
    {
      title: "Crisis Text Line",
      url: "https://www.crisistextline.org",
      phone: "Text HOME to 741741"
    }
  ];

  return null;
}