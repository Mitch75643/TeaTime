import { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { X, ArrowRight, Sparkles, MessageCircle, Users, Settings, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  id: string;
  title: string;
  message: string;
  target?: string; // CSS selector for element to highlight
  position: "center" | "top" | "bottom" | "left" | "right";
  showPointer?: boolean;
  icon?: React.ReactNode;
  buttonText?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Tfess",
    message: "Where you can speak freely, stay anonymous, and spill what's really on your mind.",
    position: "center",
    icon: <Sparkles className="h-6 w-6" />,
    buttonText: "Show me how"
  },
  {
    id: "create-post",
    title: "Start a Conversation",
    message: "Tap here to share a thought, confession, or opinion anonymously. Choose from different categories to find your vibe.",
    target: "[data-tour='create-post']",
    position: "top",
    showPointer: true,
    icon: <MessageCircle className="h-5 w-5" />,
    buttonText: "Got it"
  },
  {
    id: "feed",
    title: "Community Feed",
    message: "This is where everyone's spills appear. Posts are sorted by topic and popularity. React and engage anonymously.",
    target: "[data-tour='feed']",
    position: "top",
    showPointer: true,
    icon: <Users className="h-5 w-5" />,
    buttonText: "Continue"
  },
  {
    id: "commenting",
    title: "Join the Conversation",
    message: "Click to react, reply, or relate to someone's spill. Everything's anonymous, so speak your truth.",
    target: "[data-tour='comment-button']",
    position: "top",
    showPointer: true,
    icon: <MessageCircle className="h-5 w-5" />,
    buttonText: "Next"
  },
  {
    id: "navigation",
    title: "Explore Different Spaces",
    message: "Tfess is full of themed spaces. Find your vibe in Daily Spill, Celebrity Tea, Community topics, or hop between them.",
    target: "[data-tour='bottom-nav']",
    position: "top",
    showPointer: true,
    icon: <Coffee className="h-5 w-5" />,
    buttonText: "Show me more"
  },
  {
    id: "profile",
    title: "Your Anonymous Identity",
    message: "Customize your anonymous look and username. You can change it any time while staying completely anonymous.",
    target: "[data-tour='profile']",
    position: "bottom",
    showPointer: true,
    icon: <Settings className="h-5 w-5" />,
    buttonText: "Almost done"
  },
  {
    id: "complete",
    title: "You're Ready to Spill",
    message: "That's it — you're all set. Speak your truth, stay anonymous, and connect with others authentically.",
    position: "center",
    icon: <Sparkles className="h-6 w-6" />,
    buttonText: "Let's Go"
  }
];

export function OnboardingTour({ isVisible, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  const step = tourSteps[currentStep];

  // Update target element and overlay when step changes
  useEffect(() => {
    if (step?.target) {
      const element = document.querySelector(step.target);
      setTargetElement(element);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        
        setOverlayStyle({
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${rect.left - padding}px 100%, 
            ${rect.left - padding}px ${rect.top - padding}px, 
            ${rect.right + padding}px ${rect.top - padding}px, 
            ${rect.right + padding}px ${rect.bottom + padding}px, 
            ${rect.left - padding}px ${rect.bottom + padding}px, 
            ${rect.left - padding}px 100%, 
            100% 100%, 
            100% 0%
          )`
        });
      }
    } else {
      setTargetElement(null);
      setOverlayStyle({});
    }
  }, [currentStep, step?.target]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const getTooltipPosition = () => {
    if (!targetElement || step.position === "center") return {};
    
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 120;
    
    switch (step.position) {
      case "top":
        return {
          top: rect.top - tooltipHeight - 16,
          left: Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2),
          transform: "none"
        };
      case "bottom":
        return {
          top: rect.bottom + 16,
          left: Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2),
          transform: "none"
        };
      case "left":
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - 16,
          transform: "none"
        };
      case "right":
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + 16,
          transform: "none"
        };
      default:
        return {};
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
        style={overlayStyle}
      />
      
      {/* Highlight Ring for Target Elements */}
      {targetElement && step.showPointer && (
        <div
          className="absolute border-4 border-orange-400 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Tour Card/Tooltip */}
      <Card 
        className={cn(
          "absolute shadow-2xl border-2 border-orange-200 bg-white/95 backdrop-blur-lg max-w-sm w-80 z-[101]",
          step.position === "center" 
            ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
            : ""
        )}
        style={step.position !== "center" ? getTooltipPosition() : {}}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {step.icon && (
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  {step.icon}
                </div>
              )}
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {step.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Message */}
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {step.message}
          </p>

          {/* Progress and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} of {tourSteps.length}
              </Badge>
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs text-gray-500"
                >
                  Skip Tour
                </Button>
              )}
            </div>
            
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
              size="sm"
            >
              {step.buttonText || "Next"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pointer/Arrow for targeted elements */}
      {targetElement && step.showPointer && step.position !== "center" && (
        <div
          className="absolute w-0 h-0 pointer-events-none z-[100]"
          style={{
            ...(() => {
              const rect = targetElement.getBoundingClientRect();
              const arrowSize = 8;
              
              switch (step.position) {
                case "top":
                  return {
                    top: rect.top - arrowSize,
                    left: rect.left + rect.width / 2 - arrowSize,
                    borderLeft: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid transparent`,
                    borderTop: `${arrowSize}px solid white`,
                  };
                case "bottom":
                  return {
                    top: rect.bottom,
                    left: rect.left + rect.width / 2 - arrowSize,
                    borderLeft: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid white`,
                  };
                case "left":
                  return {
                    top: rect.top + rect.height / 2 - arrowSize,
                    left: rect.left - arrowSize,
                    borderTop: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid transparent`,
                    borderLeft: `${arrowSize}px solid white`,
                  };
                case "right":
                  return {
                    top: rect.top + rect.height / 2 - arrowSize,
                    left: rect.right,
                    borderTop: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid white`,
                  };
                default:
                  return {};
              }
            })()
          }}
        />
      )}
    </div>
  );
}

// Hook to manage onboarding tour state
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem("tfess-onboarding-completed");
    const firstVisit = !hasCompletedTour;
    
    setIsFirstVisit(firstVisit);
    
    // Auto-show welcome screen for first-time users after a brief delay
    if (firstVisit) {
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTourFromWelcome = () => {
    setShowWelcome(false);
    setTimeout(() => setShowTour(true), 300);
  };

  const startTour = () => setShowTour(true);

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem("tfess-onboarding-completed", "true");
  };

  const skipTour = () => {
    setShowTour(false);
    localStorage.setItem("tfess-onboarding-completed", "true");
  };

  const skipWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("tfess-onboarding-completed", "true");
  };

  return {
    showTour,
    showWelcome,
    isFirstVisit,
    startTour,
    startTourFromWelcome,
    completeTour,
    skipTour,
    skipWelcome
  };
}