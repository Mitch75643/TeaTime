import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Sparkles, User, MessageCircle, Shield, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import tfessLogo from "../../assets/fessr-logo.png";

interface WelcomeScreenProps {
  isVisible: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ isVisible, onStartTour, onSkip }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);

  const features = [
    {
      icon: <User className="h-6 w-6" />,
      title: "Stay Anonymous",
      description: "Share freely without revealing your identity"
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Express Yourself",
      description: "Spill your thoughts, confessions, and opinions"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Safe Space",
      description: "A judgment-free zone for authentic conversations"
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-lg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-orange-200 bg-white/95 backdrop-blur-lg">
        <CardContent className="p-8 text-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkip}
            className="absolute top-4 right-4 h-6 w-6 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Logo and Branding */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
                <img 
                  src={tfessLogo} 
                  alt="Tfess Logo" 
                  className="h-8 w-8 object-contain filter brightness-0 invert"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Tfess</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Where you can speak freely, stay anonymous, and spill what's really on your mind.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                  <p className="text-gray-600 text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Anonymous Badge */}
          <div className="mb-6">
            <Badge variant="secondary" className="px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200">
              <Shield className="h-3 w-3 mr-1" />
              100% Anonymous
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onStartTour}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Show me how it works
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={onSkip}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Skip and explore
            </Button>
          </div>

          {/* Subtle Animation */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 animate-pulse"></div>
        </CardContent>
      </Card>
    </div>
  );
}