/**
 * @fileoverview Platform Configuration Page
 * Dedicated admin page for platform-wide configuration management
 */

import { AppLayout } from '@/components/AppLayout';
import { PlatformConfigSettings } from '@/components/settings/PlatformConfigSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sliders, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function PlatformConfiguration() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <AppLayout title="Platform Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </Button>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Shield className="h-3 w-3" />
            Admin Only
          </Badge>
        </div>

        {/* Page Header Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Sliders className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Platform Configuration</CardTitle>
                <CardDescription>
                  Manage system-wide defaults for AI, analysis, security, and automation settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Configuration Panel */}
        <PlatformConfigSettings />
      </div>
    </AppLayout>
  );
}
