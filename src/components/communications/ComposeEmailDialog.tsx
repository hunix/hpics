import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { ContactPicker } from '@/components/contacts/ContactPicker';
import { invokeFunction } from '@/lib/api';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  defaultSubject?: string;
  profileId?: string;
  profileName?: string;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  defaultTo = '',
  defaultSubject = '',
  profileId,
  profileName,
}: ComposeEmailDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Simplified templates - remove query for now due to type issues
  const templates: { id: string; template_name: string; subject?: string; content?: string }[] = [];

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('send-email', {
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          body,
          profileId,
          userId: user?.id,
        },);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Email sent successfully' });
      onOpenChange(false);
      // Reset form
      setTo(defaultTo);
      setCc('');
      setBcc('');
      setSubject(defaultSubject);
      setBody('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to send email',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApplyTemplate = (template: { subject?: string; content?: string }) => {
    if (template.subject) setSubject(template.subject);
    if (template.content) setBody(template.content);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in To, Subject, and Body fields',
        variant: 'destructive',
      });
      return;
    }
    sendEmailMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            {profileName ? `Send an email to ${profileName}` : 'Send an email'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <div className="flex gap-2">
              <Input
                id="to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCcBcc(!showCcBcc)}
              >
                CC/BCC
                {showCcBcc ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {showCcBcc && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cc">CC</Label>
                <Input
                  id="cc"
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bcc">BCC</Label>
                <Input
                  id="bcc"
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          {templates && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Templates</Label>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 5).map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    {template.template_name || 'Use Template'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              rows={10}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
