import { ParseResult } from './linkedinCsvParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useState } from 'react';

interface ImportDiagnosticsPanelProps {
  fileName: string;
  fileSize: number;
  parseResult: ParseResult;
}

export function ImportDiagnosticsPanel({ fileName, fileSize, parseResult }: ImportDiagnosticsPanelProps) {
  const [showRawLines, setShowRawLines] = useState(false);
  const [showHeaders, setShowHeaders] = useState(true);
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const getDelimiterName = (d: string) => {
    switch (d) {
      case ',': return 'Comma';
      case ';': return 'Semicolon';
      case '\t': return 'Tab';
      case '|': return 'Pipe';
      default: return d;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          File Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">File:</span>{' '}
            <span className="font-medium">{fileName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Size:</span>{' '}
            <span className="font-medium">{formatFileSize(fileSize)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Lines:</span>{' '}
            <span className="font-medium">{parseResult.rawLineCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Data rows:</span>{' '}
            <span className="font-medium">{parseResult.parsedRowCount}</span>
          </div>
        </div>
        
        {/* Detection info */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={parseResult.delimiterConfidence === 'high' ? 'default' : 'secondary'}>
            Delimiter: {getDelimiterName(parseResult.delimiter)}
            {parseResult.delimiterConfidence !== 'high' && ` (${parseResult.delimiterConfidence})`}
          </Badge>
          {parseResult.bomDetected && (
            <Badge variant="outline">BOM detected</Badge>
          )}
          <Badge variant="outline">
            Line endings: {parseResult.lineEndingStyle.toUpperCase()}
          </Badge>
          <Badge variant="outline">
            Header at line {parseResult.headerLineIndex + 1}
          </Badge>
        </div>
        
        {/* Warnings */}
        {parseResult.warnings.length > 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-sm font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              {parseResult.warnings.length} parsing warning(s)
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {parseResult.warnings.slice(0, 5).map((w, i) => (
                <li key={i}>Line {w.line}: {w.message}</li>
              ))}
              {parseResult.warnings.length > 5 && (
                <li className="text-muted-foreground/60">...and {parseResult.warnings.length - 5} more</li>
              )}
            </ul>
          </div>
        )}
        
        {/* Headers */}
        <Collapsible open={showHeaders} onOpenChange={setShowHeaders}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
            <ChevronDown className={`h-4 w-4 transition-transform ${showHeaders ? '' : '-rotate-90'}`} />
            Detected Headers ({parseResult.headers.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="flex flex-wrap gap-1.5">
              {parseResult.headers.map((header, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {i + 1}. {header || '(empty)'}
                </Badge>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Raw lines preview */}
        <Collapsible open={showRawLines} onOpenChange={setShowRawLines}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
            <ChevronDown className={`h-4 w-4 transition-transform ${showRawLines ? '' : '-rotate-90'}`} />
            Raw Lines Preview
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-muted/50 rounded-lg p-3 overflow-x-auto">
              <pre className="text-xs whitespace-pre font-mono">
                {parseResult.sampleRawLines.slice(0, 10).map((line, i) => (
                  <div key={i} className={i === parseResult.headerLineIndex ? 'text-primary font-semibold' : ''}>
                    {i + 1}: {line.slice(0, 200)}{line.length > 200 ? '...' : ''}
                  </div>
                ))}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Success indicator */}
        {parseResult.success && parseResult.parsedRowCount > 0 && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm">
            <CheckCircle className="h-4 w-4" />
            Successfully parsed {parseResult.parsedRowCount} data rows
          </div>
        )}
        
        {/* Error state */}
        {(!parseResult.success || parseResult.parsedRowCount === 0) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {parseResult.error || 'No data rows found after header'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Check that this is a LinkedIn Connections export file (Connections.csv)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
