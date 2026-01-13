/**
 * @fileoverview Integration Health Dashboard
 * Comprehensive view of all integration statuses, test history, and health metrics
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  useIntegrationHealth, 
  type IntegrationHealthStatus 
} from '@/hooks/useIntegrationHealth';
import { useTestIntegration } from '@/hooks/useTestIntegration';
import { CATEGORY_INFO, type IntegrationCategory } from '@/lib/integrations/registry';
import { 
  CheckCircle2, XCircle, AlertTriangle, Zap, RefreshCw, 
  ChevronDown, Clock, Activity, TrendingUp, Shield,
  Loader2, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// READINESS SCORE CARD
// ============================================================================

function ReadinessScoreCard({ 
  score, 
  configuredCount, 
  totalCount,
  healthyCount,
  warningCount,
  errorCount
}: { 
  score: number;
  configuredCount: number;
  totalCount: number;
  healthyCount: number;
  warningCount: number;
  errorCount: number;
}) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Basic';
    return 'Limited';
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Score */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${(score / 100) * 220} 220`}
                  className={getScoreColor()}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-xl font-bold", getScoreColor())}>{score}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Intelligence Readiness</h3>
              <Badge variant="outline" className={getScoreColor()}>
                {getScoreLabel()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {configuredCount} of {totalCount} integrations
              </p>
            </div>
          </div>

          {/* Health Metrics */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Health Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Healthy</span>
                </div>
                <span className="font-medium">{healthyCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Warning</span>
                </div>
                <span className="font-medium">{warningCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  <span className="text-sm">Error</span>
                </div>
                <span className="font-medium">{errorCount}</span>
              </div>
            </div>
          </div>

          {/* Progress Visualization */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Configuration Progress</h4>
            <Progress value={score} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Configure more integrations to unlock additional intelligence capabilities
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// INTEGRATION HEALTH CARD
// ============================================================================

function IntegrationHealthCard({ 
  status,
  onTest
}: { 
  status: IntegrationHealthStatus;
  onTest: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = status.integration.icon;

  const getStatusBadge = () => {
    switch (status.status) {
      case 'healthy':
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Healthy
          </Badge>
        );
      case 'connector':
        return (
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            Connector
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="text-rose-600 border-rose-600/30 gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <XCircle className="h-3 w-3" />
            Not Configured
          </Badge>
        );
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "border rounded-lg transition-all duration-200",
        isOpen && "ring-1 ring-primary/20"
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center gap-4 text-left hover:bg-accent/30 transition-colors">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              status.isConfigured ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                status.isConfigured ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{status.integration.name}</h4>
                {getStatusBadge()}
              </div>
              {status.lastTest && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last tested {formatDistanceToNow(new Date(status.lastTest.tested_at))} ago
                  {status.averageResponseTime && ` • Avg: ${status.averageResponseTime}ms`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {status.isConfigured && !status.integration.isConnector && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTest();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Zap className="h-4 w-4" />
                </Button>
              )}
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border/50">
            {/* Configuration Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">
                  {status.secretsConfigured}/{status.secretsTotal}
                </div>
                <div className="text-xs text-muted-foreground">Secrets Configured</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{status.testCount}</div>
                <div className="text-xs text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className={cn(
                  "text-2xl font-bold",
                  status.successRate >= 80 ? "text-emerald-500" : 
                  status.successRate >= 50 ? "text-amber-500" : "text-rose-500"
                )}>
                  {status.testCount > 0 ? `${Math.round(status.successRate)}%` : '-'}
                </div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">
                  {status.averageResponseTime ? `${status.averageResponseTime}ms` : '-'}
                </div>
                <div className="text-xs text-muted-foreground">Avg Response</div>
              </div>
            </div>

            {/* Last Test Result */}
            {status.lastTest && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                status.lastTest.success 
                  ? "bg-emerald-500/10 border border-emerald-500/20" 
                  : "bg-rose-500/10 border border-rose-500/20"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {status.lastTest.success 
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <XCircle className="h-4 w-4 text-rose-500" />
                  }
                  <span className="font-medium">
                    {status.lastTest.success ? 'Last test passed' : 'Last test failed'}
                  </span>
                </div>
                <p className="text-muted-foreground">{status.lastTest.message}</p>
              </div>
            )}

            {/* Features */}
            <div>
              <h5 className="text-sm font-medium mb-2">Features</h5>
              <div className="flex flex-wrap gap-1">
                {status.integration.features.map(feature => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Documentation Link */}
            <div className="flex items-center justify-between pt-2">
              <a
                href={status.integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View documentation
                <ExternalLink className="h-3 w-3" />
              </a>
              
              {status.integration.edgeFunctions && status.integration.edgeFunctions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Used by: {status.integration.edgeFunctions.slice(0, 2).join(', ')}
                  {status.integration.edgeFunctions.length > 2 && ` +${status.integration.edgeFunctions.length - 2}`}
                </span>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export function IntegrationHealthDashboard() {
  const { data: health, isLoading, refetch } = useIntegrationHealth();
  const testMutation = useTestIntegration();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleTestIntegration = (status: IntegrationHealthStatus) => {
    const primarySecret = status.integration.secrets[0];
    if (primarySecret) {
      // Note: This would need the actual API key - in practice, the test
      // is triggered from the integration card where the key is entered
      testMutation.mutate({
        integrationId: primarySecret.key,
        apiKey: 'test', // This is a placeholder - actual testing happens in UnifiedIntegrationSettings
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Unable to load integration health data
        </CardContent>
      </Card>
    );
  }

  const categories = Object.keys(health.byCategory) as IntegrationCategory[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Integration Health
          </h2>
          <p className="text-muted-foreground">
            Monitor integration status, test results, and system readiness
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Readiness Score */}
      <ReadinessScoreCard
        score={health.readinessScore}
        configuredCount={health.configuredCount}
        totalCount={health.totalCount}
        healthyCount={health.healthyCount}
        warningCount={health.warningCount}
        errorCount={health.errorCount}
      />

      {/* Category Tabs */}
      <Tabs defaultValue={categories[0]} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {categories.map(category => {
            const categoryInfo = CATEGORY_INFO[category];
            const categoryStatuses = health.byCategory[category] || [];
            const configuredInCategory = categoryStatuses.filter(s => s.isConfigured).length;
            
            return (
              <TabsTrigger
                key={category}
                value={category}
                className="flex items-center gap-2"
              >
                <categoryInfo.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{categoryInfo.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {configuredInCategory}/{categoryStatuses.length}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(category => {
          const categoryInfo = CATEGORY_INFO[category];
          const categoryStatuses = health.byCategory[category] || [];
          
          return (
            <TabsContent key={category} value={category} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <categoryInfo.icon className="h-5 w-5" />
                    {categoryInfo.label}
                  </CardTitle>
                  <CardDescription>{categoryInfo.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryStatuses.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No integrations in this category
                    </p>
                  ) : (
                    categoryStatuses.map(status => (
                      <IntegrationHealthCard
                        key={status.integration.id}
                        status={status}
                        onTest={() => handleTestIntegration(status)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center">
        Last updated: {health.lastUpdated.toLocaleString()}
      </p>
    </div>
  );
}
