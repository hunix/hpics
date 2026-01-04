import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, EyeOff, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ResendIntegrationProps {
  isConfigured: boolean;
  onSave: () => void;
}

export function ResendIntegration({ isConfigured, onSave }: ResendIntegrationProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    if (!apiKey.startsWith("re_")) {
      toast.warning("Resend API keys typically start with 're_'");
    }

    setIsSaving(true);
    // The actual saving is handled by the secrets tool
    // This component just triggers the parent callback
    toast.info("Please use the secret input form below to save your API key");
    setIsSaving(false);
    onSave();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Email Sending (Resend)</CardTitle>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </span>
            ) : (
              "Not configured"
            )}
          </Badge>
        </div>
        <CardDescription>
          Configure Resend to enable email notifications and reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="resend-key">API Key</Label>
          <div className="relative">
            <Input
              id="resend-key"
              type={showKey ? "text" : "password"}
              placeholder={isConfigured ? "••••••••••••••••" : "re_xxxxxxxxxx"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>To get your API key:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Sign up at Resend.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Verify your email domain
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Create an API key
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ol>
        </div>

        <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
          {isSaving ? "Saving..." : "Save API Key"}
        </Button>
      </CardContent>
    </Card>
  );
}
