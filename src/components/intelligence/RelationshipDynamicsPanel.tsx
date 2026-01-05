import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Scale, TrendingUp, TrendingDown, Heart, Users } from 'lucide-react';
import type { PsychologicalProfile } from '@/lib/psychologicalAnalysis';

interface RelationshipDynamicsPanelProps {
  profile: PsychologicalProfile;
}

export function RelationshipDynamicsPanel({ profile }: RelationshipDynamicsPanelProps) {
  const dynamics = profile.relationship_dynamics as any;

  if (!dynamics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No relationship dynamics data available.</p>
        <p className="text-sm mt-1">Run a deep analysis to understand relationship patterns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Power Balance */}
      {dynamics.power_balance && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-4 w-4" />
            <span className="text-sm font-medium">Power Dynamics</span>
          </div>
          
          <div className="space-y-2">
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
                style={{ left: '50%' }}
              />
              <div 
                className={`absolute top-0 bottom-0 ${
                  dynamics.power_balance.score >= 0 ? 'bg-primary' : 'bg-secondary'
                }`}
                style={{ 
                  left: dynamics.power_balance.score >= 0 ? '50%' : 'auto',
                  right: dynamics.power_balance.score < 0 ? '50%' : 'auto',
                  width: `${Math.min(Math.abs(dynamics.power_balance.score) / 2, 50)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>They dominate</span>
              <span>Balanced</span>
              <span>You dominate</span>
            </div>
            
            {dynamics.power_balance.areas_of_dominance?.length > 0 && (
              <div className="text-xs mt-2">
                <span className="text-muted-foreground">Areas of dominance: </span>
                {dynamics.power_balance.areas_of_dominance.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust Level */}
      {dynamics.trust_level && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-medium">Trust Level</span>
            </div>
            <Badge 
              variant={
                dynamics.trust_level.trajectory === 'growing' ? 'default' :
                dynamics.trust_level.trajectory === 'stable' ? 'secondary' :
                'destructive'
              }
              className="flex items-center gap-1"
            >
              {dynamics.trust_level.trajectory === 'growing' ? (
                <TrendingUp className="h-3 w-3" />
              ) : dynamics.trust_level.trajectory === 'declining' ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {dynamics.trust_level.trajectory}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Progress value={dynamics.trust_level.score} className="flex-1 h-2" />
            <span className="text-sm font-medium">{dynamics.trust_level.score}%</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {dynamics.trust_level.trust_builders?.length > 0 && (
              <div>
                <span className="text-green-600 font-medium">Builders:</span>
                <ul className="list-disc list-inside text-muted-foreground">
                  {dynamics.trust_level.trust_builders.slice(0, 2).map((b: string, i: number) => (
                    <li key={i} className="truncate">{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {dynamics.trust_level.trust_breakers?.length > 0 && (
              <div>
                <span className="text-destructive font-medium">Risks:</span>
                <ul className="list-disc list-inside text-muted-foreground">
                  {dynamics.trust_level.trust_breakers.slice(0, 2).map((b: string, i: number) => (
                    <li key={i} className="truncate">{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investment Asymmetry */}
      {dynamics.investment_asymmetry && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Investment Balance</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="text-center">
              <div className="text-2xl font-bold">{dynamics.investment_asymmetry.your_investment}%</div>
              <div className="text-xs text-muted-foreground">Your investment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{dynamics.investment_asymmetry.their_investment}%</div>
              <div className="text-xs text-muted-foreground">Their investment</div>
            </div>
          </div>
          
          {dynamics.investment_asymmetry.recommendation && (
            <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
              {dynamics.investment_asymmetry.recommendation}
            </p>
          )}
        </div>
      )}

      {/* Compatibility */}
      {dynamics.compatibility_analysis && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Compatibility Analysis</span>
            <Badge variant="outline" className="text-lg font-bold">
              {dynamics.compatibility_analysis.overall_score}%
            </Badge>
          </div>
          
          <div className="space-y-2">
            {Object.entries(dynamics.compatibility_analysis)
              .filter(([key]) => key !== 'overall_score')
              .map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="w-32 text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <Progress value={value as number} className="flex-1 h-1.5" />
                  <span className="w-8 text-right">{value as number}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
