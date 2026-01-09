import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Users, Calendar, 
  MessageSquare, Shield, LayoutDashboard, Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  target?: string; // CSS selector for highlight
  route?: string;
  action?: 'click' | 'observe';
  gradient: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PICS Intelligence',
    description: 'Your AI-powered personal intelligence and CRM system. Let\'s take a quick tour of the key features.',
    icon: Sparkles,
    gradient: 'from-violet-500 to-indigo-500',
  },
  {
    id: 'dashboard',
    title: 'Command Center Dashboard',
    description: 'Your mission control. View relationship health, upcoming events, and AI-powered insights at a glance.',
    icon: LayoutDashboard,
    route: '/dashboard',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'contacts',
    title: 'Contact Management',
    description: 'Store detailed profiles with photos, documents, and relationship history. AI helps you remember important details.',
    icon: Users,
    route: '/contacts',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'calendar',
    title: 'Smart Calendar',
    description: 'Track meetings, birthdays, and important dates. AI suggests optimal times for follow-ups.',
    icon: Calendar,
    route: '/calendar',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'communications',
    title: 'Communication Hub',
    description: 'Log calls, emails, and messages. AI analyzes sentiment and suggests conversation topics.',
    icon: MessageSquare,
    route: '/communications',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Your data is encrypted and secure. Role-based access control ensures only authorized access.',
    icon: Shield,
    gradient: 'from-red-500 to-rose-600',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start by adding your first contact or exploring the dashboard. Use ⌘K anytime to quickly search.',
    icon: Check,
    gradient: 'from-emerald-500 to-green-500',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export function OnboardingTour({ onComplete, forceShow = false }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if tour has been completed
    const tourCompleted = localStorage.getItem('pics-onboarding-completed');
    if (!tourCompleted || forceShow) {
      setIsVisible(true);
    }
  }, [forceShow]);
  
  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const Icon = step.icon;
  
  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = tourSteps[currentStep + 1];
      if (nextStep.route) {
        navigate(nextStep.route);
      }
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, navigate]);
  
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = tourSteps[currentStep - 1];
      if (prevStep.route) {
        navigate(prevStep.route);
      }
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, navigate]);
  
  const handleComplete = useCallback(() => {
    localStorage.setItem('pics-onboarding-completed', 'true');
    setIsVisible(false);
    onComplete();
  }, [onComplete]);
  
  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        {/* Tour Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl border overflow-hidden"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0">
            <Progress value={progress} className="h-1 rounded-none" />
          </div>
          
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          
          {/* Content */}
          <div className="p-8 pt-10">
            {/* Icon */}
            <motion.div
              key={step.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className={cn(
                'w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center',
                'bg-gradient-to-br shadow-lg',
                step.gradient
              )}
            >
              <Icon className="h-8 w-8 text-white" />
            </motion.div>
            
            {/* Text */}
            <motion.div
              key={`text-${step.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8"
            >
              <h2 className="text-xl font-bold mb-2">{step.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
            
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {tourSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentStep 
                      ? 'bg-primary w-6' 
                      : index < currentStep 
                        ? 'bg-primary/50' 
                        : 'bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              
              {currentStep < tourSteps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className={cn(
                    'flex-1 bg-gradient-to-r text-white',
                    step.gradient
                  )}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                >
                  Get Started
                  <Sparkles className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Skip link */}
          <div className="pb-4 text-center">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
