import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAIBudget } from "@/hooks/useAIBudget";
import { useAuth } from "@/hooks/useAuth";

export function AIBudgetWarning() {
  const { user, loading: authLoading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const budget = useAIBudget();

  // Don't render anything if not logged in or still loading
  if (!user || authLoading || budget.isLoading) {
    return null;
  }

  // Calculate warning level with safe access
  const getWarningLevel = () => {
    try {
      if (budget.daily?.isOver || budget.weekly?.isOver || budget.monthly?.isOver) {
        return 'exceeded';
      }
      
      const dailyPercent = budget.daily?.budget ? (budget.daily.spent / budget.daily.budget) * 100 : 0;
      const weeklyPercent = budget.weekly?.budget ? (budget.weekly.spent / budget.weekly.budget) * 100 : 0;
      const monthlyPercent = budget.monthly?.budget ? (budget.monthly.spent / budget.monthly.budget) * 100 : 0;
      const maxPercent = Math.max(dailyPercent, weeklyPercent, monthlyPercent);
      
      if (maxPercent >= 90) return 'critical';
      if (maxPercent >= 75) return 'approaching';
      return 'none';
    } catch {
      return 'none';
    }
  };

  const warningLevel = getWarningLevel();

  // Show toasts only when budget thresholds are hit
  useEffect(() => {
    if (warningLevel === 'exceeded') {
      toast.error("AI budget limit exceeded", {
        description: "Some AI features may be unavailable until the limit resets.",
        duration: 10000,
      });
    } else if (warningLevel === 'critical') {
      toast.warning("AI budget at 90%+", {
        description: "You're approaching your AI usage limit.",
        duration: 5000,
      });
    }
  }, [warningLevel]);

  if (warningLevel === 'none' || dismissed) {
    return null;
  }

  const dailyPercent = budget.daily?.budget ? (budget.daily.spent / budget.daily.budget) * 100 : 0;
  const weeklyPercent = budget.weekly?.budget ? (budget.weekly.spent / budget.weekly.budget) * 100 : 0;
  const monthlyPercent = budget.monthly?.budget ? (budget.monthly.spent / budget.monthly.budget) * 100 : 0;
  const maxPercent = Math.max(dailyPercent, weeklyPercent, monthlyPercent);

  const getMessage = () => {
    if (warningLevel === 'exceeded') {
      return "You've exceeded your AI usage limit. Some features may be unavailable.";
    }
    if (warningLevel === 'critical') {
      return `You've used over 90% of your AI budget (${maxPercent.toFixed(0)}%).`;
    }
    return `You've used ${maxPercent.toFixed(0)}% of your AI budget.`;
  };

  return (
    <Alert variant={warningLevel === 'exceeded' ? 'destructive' : 'default'} className="mb-4">
      {warningLevel === 'exceeded' ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      <AlertTitle className="flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        AI Budget Warning
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{getMessage()}</span>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}
