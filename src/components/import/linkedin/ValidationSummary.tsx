import { ValidationResult, ValidationIssue } from './linkedinValidation';
import { MappedContact } from './linkedinMapping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, Download } from 'lucide-react';
import { useState } from 'react';

interface ValidationSummaryProps {
  validation: ValidationResult;
  onDownloadDiagnostics: () => void;
}

const REASON_LABELS: Record<ValidationIssue['reason'], string> = {
  empty_row: 'Empty row',
  no_identifier: 'No identifier',
  duplicate_email: 'Duplicate email',
  duplicate_url: 'Duplicate URL',
  invalid_email: 'Invalid email'
};

export function ValidationSummary({ validation, onDownloadDiagnostics }: ValidationSummaryProps) {
  const [showIssues, setShowIssues] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  const issuesByReason = validation.issues.reduce((acc, issue) => {
    acc[issue.reason] = (acc[issue.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {validation.importableCount > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            Validation Results
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onDownloadDiagnostics} className="gap-1">
            <Download className="h-3 w-3" />
            Diagnostics
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{validation.totalRows}</div>
            <div className="text-xs text-muted-foreground">Total rows</div>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{validation.importableCount}</div>
            <div className="text-xs text-muted-foreground">Importable</div>
          </div>
          <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{validation.skippedCount}</div>
            <div className="text-xs text-muted-foreground">Skipped</div>
          </div>
        </div>
        
        {/* Issue breakdown */}
        {validation.skippedCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(issuesByReason).map(([reason, count]) => (
              <Badge key={reason} variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {REASON_LABELS[reason as ValidationIssue['reason']] || reason}: {count}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Issues list */}
        {validation.issues.length > 0 && (
          <Collapsible open={showIssues} onOpenChange={setShowIssues}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
              <ChevronDown className={`h-4 w-4 transition-transform ${showIssues ? '' : '-rotate-90'}`} />
              View Skipped Rows ({Math.min(20, validation.issues.length)} of {validation.issues.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Line</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.issues.slice(0, 20).map((issue, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{issue.lineNumber}</TableCell>
                        <TableCell className="text-sm">{REASON_LABELS[issue.reason]}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {issue.details || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Preview of importable contacts */}
        {validation.importableCount > 0 && (
          <Collapsible open={showPreview} onOpenChange={setShowPreview}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
              <ChevronDown className={`h-4 w-4 transition-transform ${showPreview ? '' : '-rotate-90'}`} />
              Preview Importable Contacts ({Math.min(10, validation.importableCount)} of {validation.importableCount})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.importableContacts.slice(0, 10).map(({ rowIndex, contact }) => (
                      <TableRow key={rowIndex}>
                        <TableCell className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contact.email || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {contact.organization || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {contact.job_title || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* No importable contacts warning */}
        {validation.importableCount === 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <XCircle className="h-4 w-4" />
              No contacts can be imported
            </div>
            <p className="text-sm text-muted-foreground">
              All rows were skipped. Check the column mapping above and ensure at least one identifier field is mapped correctly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
