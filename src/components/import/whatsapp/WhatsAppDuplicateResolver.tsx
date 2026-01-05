import { format } from 'date-fns';
import { AlertTriangle, Plus, Replace, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { DuplicateAction, ExistingConversation } from './types';
import { useState } from 'react';

interface WhatsAppDuplicateResolverProps {
  contactName: string;
  existingConversation: ExistingConversation;
  newMessageCount: number;
  newDateRange: { start: Date | null; end: Date | null };
  onResolve: (action: DuplicateAction, remember: boolean) => void;
  onCancel: () => void;
}

export function WhatsAppDuplicateResolver({
  contactName,
  existingConversation,
  newMessageCount,
  newDateRange,
  onResolve,
  onCancel,
}: WhatsAppDuplicateResolverProps) {
  const [selectedAction, setSelectedAction] = useState<DuplicateAction>('append_new');
  const [rememberChoice, setRememberChoice] = useState(false);

  return (
    <Card className="border-warning">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle className="text-lg">Existing Conversation Found</CardTitle>
        </div>
        <CardDescription>
          A WhatsApp conversation with "{contactName}" already exists
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Existing conversation info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="text-sm font-medium mb-2">Existing Conversation</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {existingConversation.messageCount} messages</li>
            {existingConversation.lastMessageAt && (
              <li>
                • Last message: {format(new Date(existingConversation.lastMessageAt), 'MMM d, yyyy')}
              </li>
            )}
          </ul>
        </div>

        {/* New import info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="text-sm font-medium mb-2">Importing</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {newMessageCount} messages</li>
            {newDateRange.start && newDateRange.end && (
              <li>
                • Date range: {format(newDateRange.start, 'MMM d, yyyy')} — {format(newDateRange.end, 'MMM d, yyyy')}
              </li>
            )}
          </ul>
        </div>

        {/* Options */}
        <RadioGroup
          value={selectedAction}
          onValueChange={(v) => setSelectedAction(v as DuplicateAction)}
          className="space-y-3"
        >
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="append_new" id="append" />
            <Label htmlFor="append" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Append new messages only</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Skip messages that already exist, add only new ones
              </p>
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="replace_all" id="replace" />
            <Label htmlFor="replace" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Replace className="h-4 w-4" />
                <span className="font-medium">Replace existing conversation</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Delete all existing messages and import fresh
              </p>
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="keep_both" id="keep_both" />
            <Label htmlFor="keep_both" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                <span className="font-medium">Keep both as separate</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Create a new conversation, keep the existing one
              </p>
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="cancel" id="cancel" />
            <Label htmlFor="cancel" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                <span className="font-medium">Cancel import</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Don't import anything, keep existing conversation
              </p>
            </Label>
          </div>
        </RadioGroup>

        {/* Remember choice */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="remember"
            checked={rememberChoice}
            onCheckedChange={(checked) => setRememberChoice(checked === true)}
          />
          <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Remember this choice for future imports
          </Label>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onResolve(selectedAction, rememberChoice)}>
          Continue Import
        </Button>
      </CardFooter>
    </Card>
  );
}
