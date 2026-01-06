import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  RefreshCw,
  User,
  Mail,
  FileImage,
  FileText,
  Users,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { useDataQualityScanner, DataQualityIssue } from '@/hooks/useDataQualityScanner';
import { useNavigate } from 'react-router-dom';

export function DataQualityMonitor() {
  const { issues, summary, isLoading, refetch, fixIssue, isFixing } = useDataQualityScanner();
  const navigate = useNavigate();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'profile':
        return <User className="h-3 w-3" />;
      case 'contact_method':
        return <Mail className="h-3 w-3" />;
      case 'media':
        return <FileImage className="h-3 w-3" />;
      case 'document':
        return <FileText className="h-3 w-3" />;
      case 'relationship':
        return <Users className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const severityColors = {
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  const handleNavigateToEntity = (issue: DataQualityIssue) => {
    if (issue.entity === 'profile') {
      navigate(`/contacts/${issue.entityId}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Data Quality Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Scanning data quality...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Data Quality Monitor
            </CardTitle>
            <CardDescription>Proactive data health scanning</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{summary.totalIssues}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/10">
            <div className="text-2xl font-bold text-destructive">{summary.criticalCount}</div>
            <div className="text-xs text-destructive/70">Critical</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.warningCount}</div>
            <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70">Warnings</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.infoCount}</div>
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Info</div>
          </div>
        </div>

        {summary.totalIssues === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="font-medium text-foreground">All Clear!</p>
            <p className="text-sm">No data quality issues detected</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {issues.slice(0, 20).map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-lg border ${severityColors[issue.severity]} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => handleNavigateToEntity(issue)}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {issue.entityName || issue.entityId.slice(0, 8)}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {getEntityIcon(issue.entity)}
                          <span className="ml-1">{issue.entity}</span>
                        </Badge>
                      </div>
                      <p className="text-sm opacity-90">{issue.description}</p>
                      <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        {issue.suggestedFix}
                      </p>
                    </div>
                    {issue.autoFixAvailable && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          fixIssue(issue);
                        }}
                        disabled={isFixing}
                      >
                        Fix
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {issues.length > 20 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  +{issues.length - 20} more issues
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
