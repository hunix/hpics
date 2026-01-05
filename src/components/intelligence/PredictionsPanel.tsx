import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Minus, Target, 
  AlertTriangle, Heart, Handshake, Clock
} from 'lucide-react';
import type { PsychologicalProfile } from '@/lib/psychologicalAnalysis';

interface PredictionsPanelProps {
  profile: PsychologicalProfile;
}

export function PredictionsPanel({ profile }: PredictionsPanelProps) {
  const predictions = profile.behavioral_predictions as any;
  const relationshipDynamics = profile.relationship_dynamics as any;

  if (!predictions && !relationshipDynamics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No predictions available yet.</p>
        <p className="text-sm mt-1">Run a deep analysis to generate behavioral forecasts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reliability Forecast */}
      {predictions?.reliability_forecast && (
        <PredictionCard
          icon={<Handshake className="h-4 w-4" />}
          title="Reliability Forecast"
          score={predictions.reliability_forecast.score}
          confidence={predictions.reliability_forecast.confidence}
          details={[
            { label: 'Follow-through', value: predictions.reliability_forecast.commitment_follow_through },
            { label: 'Punctuality', value: predictions.reliability_forecast.punctuality },
            { label: 'Promise-keeping', value: predictions.reliability_forecast.promise_keeping },
          ]}
          factors={predictions.reliability_forecast.factors}
        />
      )}

      {/* Conflict Probability */}
      {predictions?.conflict_probability && (
        <PredictionCard
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Conflict Risk"
          score={predictions.conflict_probability.score}
          confidence={predictions.conflict_probability.confidence}
          isRisk
          details={[
            { 
              label: 'Escalation Risk', 
              value: null,
              badge: predictions.conflict_probability.escalation_risk 
            },
          ]}
          factors={predictions.conflict_probability.likely_triggers}
          factorsLabel="Likely triggers"
          extra={
            predictions.conflict_probability.de_escalation_strategies?.length > 0 && (
              <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                <span className="font-medium">De-escalation strategies:</span>
                <ul className="list-disc list-inside text-muted-foreground mt-1">
                  {predictions.conflict_probability.de_escalation_strategies.slice(0, 2).map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )
          }
        />
      )}

      {/* Engagement Trend */}
      {predictions?.engagement_trend && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-medium">Engagement Trajectory</span>
            </div>
            <Badge 
              variant={
                predictions.engagement_trend.trajectory === 'growing' ? 'default' :
                predictions.engagement_trend.trajectory === 'stable' ? 'secondary' :
                'destructive'
              }
              className="flex items-center gap-1"
            >
              {predictions.engagement_trend.trajectory === 'growing' ? (
                <TrendingUp className="h-3 w-3" />
              ) : predictions.engagement_trend.trajectory === 'declining' ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {predictions.engagement_trend.trajectory}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Investment Level</span>
              <Badge variant="outline">{predictions.engagement_trend.investment_level}</Badge>
            </div>
            
            <div className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Reciprocity Balance</span>
                <span className={
                  predictions.engagement_trend.reciprocity_balance > 20 ? 'text-green-500' :
                  predictions.engagement_trend.reciprocity_balance < -20 ? 'text-destructive' :
                  'text-muted-foreground'
                }>
                  {predictions.engagement_trend.reciprocity_balance > 0 ? '+' : ''}
                  {predictions.engagement_trend.reciprocity_balance}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-foreground"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                />
                <div 
                  className={`absolute top-0 bottom-0 ${
                    predictions.engagement_trend.reciprocity_balance >= 0 ? 'bg-green-500' : 'bg-destructive'
                  }`}
                  style={{ 
                    left: predictions.engagement_trend.reciprocity_balance >= 0 ? '50%' : 'auto',
                    right: predictions.engagement_trend.reciprocity_balance < 0 ? '50%' : 'auto',
                    width: `${Math.abs(predictions.engagement_trend.reciprocity_balance) / 2}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>They invest more</span>
                <span>You invest more</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Confidence</span>
            <span>{predictions.engagement_trend.confidence}%</span>
          </div>
        </div>
      )}

      {/* Crisis Response */}
      {predictions?.crisis_response && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Crisis Response Prediction</span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">Predicted behavior: </span>
              <span>{predictions.crisis_response.predicted_behavior}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Support-seeking</span>
              <Badge variant="outline">{predictions.crisis_response.support_seeking}</Badge>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Resilience Level</span>
                <span>{predictions.crisis_response.resilience_level}/100</span>
              </div>
              <Progress value={predictions.crisis_response.resilience_level} className="h-1.5" />
            </div>
            
            {predictions.crisis_response.recommended_support_approach && (
              <div className="mt-2 p-2 bg-background/50 rounded">
                <span className="font-medium">How to support: </span>
                <span className="text-muted-foreground">
                  {predictions.crisis_response.recommended_support_approach}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Relationship Growth Potential */}
      {relationshipDynamics?.growth_potential && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Growth Potential</span>
            </div>
            <Badge>{relationshipDynamics.growth_potential.score}/100</Badge>
          </div>
          
          <Progress value={relationshipDynamics.growth_potential.score} className="h-2 mb-3" />
          
          {relationshipDynamics.growth_potential.limiting_factors?.length > 0 && (
            <div className="text-xs mb-2">
              <span className="font-medium text-destructive">Limiting factors:</span>
              <ul className="list-disc list-inside text-muted-foreground mt-0.5">
                {relationshipDynamics.growth_potential.limiting_factors.slice(0, 2).map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          
          {relationshipDynamics.growth_potential.growth_opportunities?.length > 0 && (
            <div className="text-xs">
              <span className="font-medium text-green-600">Opportunities:</span>
              <ul className="list-disc list-inside text-muted-foreground mt-0.5">
                {relationshipDynamics.growth_potential.growth_opportunities.slice(0, 2).map((o: string, i: number) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}
          
          {relationshipDynamics.growth_potential.optimal_trajectory && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              Optimal path: {relationshipDynamics.growth_potential.optimal_trajectory}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface PredictionCardProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  confidence: number;
  isRisk?: boolean;
  details?: Array<{ label: string; value: number | null; badge?: string }>;
  factors?: string[];
  factorsLabel?: string;
  extra?: React.ReactNode;
}

function PredictionCard({ 
  icon, 
  title, 
  score, 
  confidence, 
  isRisk,
  details,
  factors,
  factorsLabel = "Key factors",
  extra
}: PredictionCardProps) {
  const getScoreColor = (s: number, risk: boolean) => {
    if (risk) {
      return s >= 70 ? 'text-destructive' : s >= 40 ? 'text-yellow-500' : 'text-green-500';
    }
    return s >= 70 ? 'text-green-500' : s >= 40 ? 'text-yellow-500' : 'text-destructive';
  };

  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getScoreColor(score, !!isRisk)}`}>
            {score}%
          </span>
        </div>
      </div>
      
      <Progress 
        value={score} 
        className={`h-1.5 mb-2 ${isRisk ? '[&>div]:bg-destructive' : ''}`}
      />
      
      {details && details.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
          {details.map((d, i) => (
            <div key={i}>
              <div className="text-muted-foreground">{d.label}</div>
              {d.value !== null ? (
                <div className="font-medium">{d.value}%</div>
              ) : d.badge ? (
                <Badge variant="outline" className="text-[10px] mt-0.5">{d.badge}</Badge>
              ) : null}
            </div>
          ))}
        </div>
      )}
      
      {factors && factors.length > 0 && (
        <div className="text-xs">
          <span className="text-muted-foreground">{factorsLabel}: </span>
          <span>{factors.slice(0, 3).join(', ')}</span>
        </div>
      )}
      
      {extra}
      
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>Confidence</span>
        <span>{confidence}%</span>
      </div>
    </div>
  );
}
