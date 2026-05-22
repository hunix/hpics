import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Zap, DollarSign, Brain, Sparkles } from 'lucide-react';
import { AI_MODEL_PRICING, getProviderColor } from '@/lib/aiPricing';

interface AIModelSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (model: string) => void;
  analysisType: string;
  title?: string;
  description?: string;
}

const AVAILABLE_MODELS = [
  {
    key: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    description: 'Fastest & cheapest. Good for simple tasks.',
    speed: 'Very Fast',
    quality: 'Basic',
    costTier: 1,
  },
  {
    key: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Balanced choice. Good multimodal & reasoning.',
    speed: 'Fast',
    quality: 'Good',
    costTier: 2,
  },
  {
    key: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Top-tier. Best for complex reasoning & analysis.',
    speed: 'Medium',
    quality: 'Excellent',
    costTier: 3,
  },
  {
    key: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    provider: 'Google',
    description: 'Next-gen. Cutting edge for deepest analysis.',
    speed: 'Medium',
    quality: 'Premium',
    costTier: 4,
  },
  {
    key: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Preview)',
    provider: 'Google',
    description: 'HPICS default. Fast Gemini 3 with balanced reasoning.',
    speed: 'Very Fast',
    quality: 'Good',
    costTier: 1,
    recommended: true,
  },
  {
    key: 'google/gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    provider: 'Google',
    description: 'Next-generation reasoning. Latest Gemini Pro.',
    speed: 'Medium',
    quality: 'Premium',
    costTier: 4,
  },
  {
    key: 'google/gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash Lite (Preview)',
    provider: 'Google',
    description: 'High-volume, cost-efficient Gemini 3.1.',
    speed: 'Very Fast',
    quality: 'Basic',
    costTier: 1,
  },
  {
    key: 'google/gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'Google',
    description: 'Fast coding, reasoning, and agentic workflows.',
    speed: 'Fast',
    quality: 'Excellent',
    costTier: 2,
  },
  {
    key: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'OpenAI',
    description: 'Fast & affordable. Good for high-volume tasks.',
    speed: 'Very Fast',
    quality: 'Basic',
    costTier: 1,
  },
  {
    key: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    description: 'Balanced. Strong reasoning at lower cost.',
    speed: 'Fast',
    quality: 'Good',
    costTier: 2,
  },
  {
    key: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    description: 'Powerful all-rounder. Excellent for nuanced analysis.',
    speed: 'Slower',
    quality: 'Excellent',
    costTier: 4,
  },
  {
    key: 'openai/gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    provider: 'OpenAI',
    description: 'Smaller, faster GPT-5.4. Strong reasoning at lower cost.',
    speed: 'Fast',
    quality: 'Excellent',
    costTier: 2,
  },
  {
    key: 'openai/gpt-5.4',
    name: 'GPT-5.4',
    provider: 'OpenAI',
    description: 'Advanced reasoning, code generation, analysis.',
    speed: 'Medium',
    quality: 'Premium',
    costTier: 4,
  },
  {
    key: 'openai/gpt-5.4-pro',
    name: 'GPT-5.4 Pro',
    provider: 'OpenAI',
    description: 'Premium reasoning for the most complex tasks.',
    speed: 'Slower',
    quality: 'Premium',
    costTier: 4,
  },
  {
    key: 'openai/gpt-5.5',
    name: 'GPT-5.5',
    provider: 'OpenAI',
    description: 'State-of-the-art reasoning and instruction following.',
    speed: 'Medium',
    quality: 'Premium',
    costTier: 4,
  },
  {
    key: 'openai/gpt-5.5-pro',
    name: 'GPT-5.5 Pro',
    provider: 'OpenAI',
    description: 'Extended reasoning for the hardest problems.',
    speed: 'Slower',
    quality: 'Premium',
    costTier: 4,
  },
];

const COST_TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: '$', color: 'text-green-500' },
  2: { label: '$$', color: 'text-yellow-500' },
  3: { label: '$$$', color: 'text-orange-500' },
  4: { label: '$$$$', color: 'text-red-500' },
};

export function AIModelSelector({
  open,
  onOpenChange,
  onSelect,
  analysisType,
  title = 'Select AI Model',
  description = 'Choose which AI model to use for this analysis.',
}: AIModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState('google/gemini-3-flash-preview');

  const handleConfirm = () => {
    onSelect(selectedModel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedModel}
          onValueChange={setSelectedModel}
          className="space-y-3"
        >
          {AVAILABLE_MODELS.map((model) => {
            const costTier = COST_TIER_LABELS[model.costTier];
            const isSelected = selectedModel === model.key;

            return (
              <div
                key={model.key}
                className={`relative flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedModel(model.key)}
              >
                <RadioGroupItem value={model.key} id={model.key} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={model.key} className="font-medium cursor-pointer">
                      {model.name}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {model.provider}
                    </Badge>
                    {model.recommended && (
                      <Badge className="text-xs bg-primary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span>{model.speed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Brain className="h-3 w-3 text-muted-foreground" />
                      <span>{model.quality}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className={costTier.color}>{costTier.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Sparkles className="h-4 w-4 mr-2" />
            Use {AVAILABLE_MODELS.find((m) => m.key === selectedModel)?.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
