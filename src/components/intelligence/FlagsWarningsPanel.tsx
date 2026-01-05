import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, CheckCircle, Shield, Info } from 'lucide-react';
import type { PsychologicalProfile, Flag, Certainty } from '@/lib/psychologicalAnalysis';

interface FlagsWarningsPanelProps {
  profile: PsychologicalProfile;
}

export function FlagsWarningsPanel({ profile }: FlagsWarningsPanelProps) {
  const flags = profile.flags as any;

  if (!flags) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No flags or warnings detected.</p>
        <p className="text-sm mt-1">Run a deep analysis to identify potential concerns.</p>
      </div>
    );
  }

  const redFlags = flags.red_flags || [];
  const yellowFlags = flags.yellow_flags || [];
  const greenFlags = flags.green_flags || [];
  const certainties = flags.certainties || [];

  const hasAnyFlags = redFlags.length > 0 || yellowFlags.length > 0 || greenFlags.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-destructive/10">
          <div className="text-lg font-bold text-destructive">{redFlags.length}</div>
          <div className="text-xs text-muted-foreground">Critical</div>
        </div>
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <div className="text-lg font-bold text-yellow-600">{yellowFlags.length}</div>
          <div className="text-xs text-muted-foreground">Caution</div>
        </div>
        <div className="p-2 rounded-lg bg-green-500/10">
          <div className="text-lg font-bold text-green-600">{greenFlags.length}</div>
          <div className="text-xs text-muted-foreground">Positive</div>
        </div>
      </div>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Critical Concerns
          </h4>
          {redFlags.map((flag: Flag, i: number) => (
            <FlagCard key={i} flag={flag} type="red" />
          ))}
        </div>
      )}

      {/* Yellow Flags */}
      {yellowFlags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            Monitor Closely
          </h4>
          {yellowFlags.map((flag: Flag, i: number) => (
            <FlagCard key={i} flag={flag} type="yellow" />
          ))}
        </div>
      )}

      {/* Green Flags */}
      {greenFlags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            Positive Indicators
          </h4>
          {greenFlags.map((flag: Flag, i: number) => (
            <FlagCard key={i} flag={flag} type="green" />
          ))}
        </div>
      )}

      {/* Certainties */}
      {certainties.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            High-Confidence Assessments
          </h4>
          <div className="space-y-2">
            {certainties.map((cert: Certainty, i: number) => (
              <div 
                key={i} 
                className="p-2 bg-primary/5 border border-primary/20 rounded-lg text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{cert.statement}</p>
                  <Badge className="shrink-0">{cert.confidence}%</Badge>
                </div>
                {cert.evidence_sources?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on: {cert.evidence_sources.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasAnyFlags && certainties.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <Info className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No significant flags identified.</p>
        </div>
      )}
    </div>
  );
}

function FlagCard({ flag, type }: { flag: Flag; type: 'red' | 'yellow' | 'green' }) {
  const colors = {
    red: 'border-destructive/30 bg-destructive/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    green: 'border-green-500/30 bg-green-500/5',
  };

  return (
    <div className={`p-2.5 rounded-lg border ${colors[type]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium">{flag.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
        </div>
        <Badge 
          variant="outline" 
          className={`shrink-0 text-[10px] ${
            type === 'red' ? 'border-destructive text-destructive' :
            type === 'yellow' ? 'border-yellow-500 text-yellow-600' :
            'border-green-500 text-green-600'
          }`}
        >
          {flag.confidence}%
        </Badge>
      </div>
      
      {flag.evidence?.length > 0 && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          <span className="font-medium">Evidence: </span>
          {flag.evidence[0]}
        </div>
      )}
      
      {flag.recommended_action && (
        <div className="mt-2 text-xs bg-background/50 p-1.5 rounded">
          <span className="font-medium">Action: </span>
          {flag.recommended_action}
        </div>
      )}
    </div>
  );
}
