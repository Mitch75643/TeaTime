import { Button } from "./button";
import { HelpCircle } from "lucide-react";
import { useOnboardingTour } from "./onboarding-tour";

export function TourTriggerButton() {
  const { startTour } = useOnboardingTour();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startTour}
      className="fixed top-20 right-4 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:bg-white dark:hover:bg-gray-800"
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      <span className="text-xs">Tour</span>
    </Button>
  );
}