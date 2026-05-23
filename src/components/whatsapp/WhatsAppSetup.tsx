import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppConfig } from '@/hooks/whatsapp/useWhatsAppChat';
import { useSaveWhatsAppConfig, useDeleteWhatsAppConfig } from '@/hooks/whatsapp/useWhatsAppSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, CheckCircle2, XCircle, Copy, ExternalLink, Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function WhatsAppSetup() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumberId: '',
    businessAccountId: '',
    displayPhoneNumber: '',
  });

  const { data: config, isLoading } = useWhatsAppConfig();

  const saveHook = useSaveWhatsAppConfig(config?.id);
  const saveMutation = {
    isPending: saveHook.isPending,
    mutate: () =>
      saveHook.mutate(formData, {
        onSuccess: () => {
          toast({ title: 'WhatsApp configuration saved' });
          setIsDialogOpen(false);
        },
        onError: (error: Error) =>
          toast({ title: 'Error', description: error.message, variant: 'destructive' }),
      }),
  };

  const deleteHook = useDeleteWhatsAppConfig();
  const deleteMutation = {
    mutate: () => {
      if (!config?.id) return;
      deleteHook.mutate(config.id, {
        onSuccess: () => toast({ title: 'WhatsApp disconnected' }),
      });
    },
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          WhatsApp Business API
        </CardTitle>
        <CardDescription>
          Connect your WhatsApp Business account to send and receive messages directly from this app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {config ? (
          <>
            <div className="flex items-center gap-2">
              {config.is_connected ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Pending Webhook Verification
                </Badge>
              )}
              {config.display_phone_number && (
                <span className="text-sm text-muted-foreground">{config.display_phone_number}</span>
              )}
            </div>

            {!config.is_connected && (
              <Alert>
                <AlertTitle>Complete Setup in Meta Business Suite</AlertTitle>
                <AlertDescription className="space-y-2 text-sm">
                  <p>Configure your webhook in Meta Business Suite:</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                      {webhookUrl}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookUrl)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Verify Token:</span>
                    <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                      {config.webhook_verify_token}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(config.webhook_verify_token)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {config.last_webhook_at && (
              <p className="text-xs text-muted-foreground">
                Last webhook: {new Date(config.last_webhook_at).toLocaleString()}
              </p>
            )}

            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => {
                    setFormData({
                      phoneNumberId: config.phone_number_id || '',
                      businessAccountId: config.business_account_id || '',
                      displayPhoneNumber: config.display_phone_number || '',
                    });
                  }}>
                    <Settings2 className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit WhatsApp Configuration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Phone Number ID *</Label>
                      <Input
                        value={formData.phoneNumberId}
                        onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                        placeholder="From Meta Business Suite"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Account ID</Label>
                      <Input
                        value={formData.businessAccountId}
                        onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Phone Number</Label>
                      <Input
                        value={formData.displayPhoneNumber}
                        onChange={(e) => setFormData({ ...formData, displayPhoneNumber: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <Button 
                      onClick={() => saveMutation.mutate()} 
                      disabled={!formData.phoneNumberId || saveMutation.isPending}
                      className="w-full"
                    >
                      {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm('Disconnect WhatsApp Business API?')) {
                    deleteMutation.mutate();
                  }
                }}
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            <Alert>
              <AlertTitle>Requirements</AlertTitle>
              <AlertDescription className="text-sm space-y-1">
                <p>• Meta Business account with WhatsApp Business API access</p>
                <p>• Verified WhatsApp Business phone number</p>
                <p>• Phone Number ID from Meta Business Suite</p>
              </AlertDescription>
            </Alert>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Connect WhatsApp Business
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect WhatsApp Business API</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Phone Number ID *</Label>
                    <Input
                      value={formData.phoneNumberId}
                      onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                      placeholder="From Meta Business Suite"
                    />
                    <p className="text-xs text-muted-foreground">
                      Find this in Meta Business Suite → WhatsApp → API Setup
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Business Account ID</Label>
                    <Input
                      value={formData.businessAccountId}
                      onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Phone Number</Label>
                    <Input
                      value={formData.displayPhoneNumber}
                      onChange={(e) => setFormData({ ...formData, displayPhoneNumber: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <Button 
                    onClick={() => saveMutation.mutate()} 
                    disabled={!formData.phoneNumberId || saveMutation.isPending}
                    className="w-full"
                  >
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Connect
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="link" asChild className="w-full">
              <a href="https://business.facebook.com/latest/settings/whatsapp-business-accounts" target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Meta Business Suite
              </a>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
