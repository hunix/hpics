import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, CheckCircle } from 'lucide-react';
import { useRecordOutcome } from '@/hooks/useInfluenceProfile';

interface OutcomeRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  strategyId?: string;
  actionId?: string;
  methodologyName?: string;
  context?: string;
  onComplete?: () => void;
}

export function OutcomeRecordingDialog({
  open,
  onOpenChange,
  profileId,
  strategyId,
  actionId,
  methodologyName = 'General Approach',
  context,
  onComplete,
}: OutcomeRecordingDialogProps) {
  const [rating, setRating] = useState(3);
  const [response, setResponse] = useState('neutral');
  const [outcome, setOutcome] = useState('');
  const [lessons, setLessons] = useState('');
  
  const recordMutation = useRecordOutcome();

  const handleSubmit = async () => {
    try {
      await recordMutation.mutateAsync({
        profile_id: profileId,
        methodology_name: methodologyName,
        strategy_id: strategyId,
        action_id: actionId,
        context: context || undefined,
        outcome: outcome || (response === 'positive' ? 'Successful outcome' : response === 'negative' ? 'Unsuccessful outcome' : 'Neutral outcome'),
        outcome_score: rating,
        response_observed: response,
        lessons: lessons || undefined,
      });
      onOpenChange(false);
      onComplete?.();
      // Reset form
      setRating(3);
      setResponse('neutral');
      setOutcome('');
      setLessons('');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Record Outcome
          </DialogTitle>
          <DialogDescription>
            Track the effectiveness of your approach for future reference
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Effectiveness Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Response Observed */}
          <div className="space-y-2">
            <Label>Response Observed</Label>
            <Select value={response} onValueChange={setResponse}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">
                  <span className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Positive Response
                  </span>
                </SelectItem>
                <SelectItem value="neutral">
                  <span className="flex items-center gap-2">
                    <span className="text-yellow-500">○</span> Neutral Response
                  </span>
                </SelectItem>
                <SelectItem value="negative">
                  <span className="flex items-center gap-2">
                    <span className="text-red-500">✗</span> Negative Response
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Outcome Description */}
          <div className="space-y-2">
            <Label>What happened? (optional)</Label>
            <Textarea
              placeholder="Describe the outcome..."
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={2}
            />
          </div>

          {/* Lessons Learned */}
          <div className="space-y-2">
            <Label>Lessons learned (optional)</Label>
            <Textarea
              placeholder="What would you do differently next time?"
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Skip
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={recordMutation.isPending}
            >
              {recordMutation.isPending ? 'Saving...' : 'Save Outcome'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
