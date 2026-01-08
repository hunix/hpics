import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target, TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface ChurnPrediction {
  id: string;
  profile_id: string;
  prediction_date: string;
  predicted_churn_probability: number;
  predicted_days_to_churn: number | null;
  risk_level: string;
  contributing_factors: Record<string, unknown> | null;
  model_used: string;
  actual_outcome: string | null;
  outcome_date: string | null;
  outcome_verified: boolean;
  accuracy_score: number | null;
}

interface PredictionStats {
  total_predictions: number;
  verified_predictions: number;
  true_positives: number;
  true_negatives: number;
  false_positives: number;
  false_negatives: number;
  accuracy: number;
  precision: number;
  recall: number;
}

const COLORS = {
  success: 'hsl(var(--chart-1))',
  warning: 'hsl(var(--chart-2))',
  danger: 'hsl(var(--chart-3))',
  neutral: 'hsl(var(--chart-4))',
};

export function PredictionAccuracyPanel() {
  const { user } = useAuth();

  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['churn-predictions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('churn_predictions')
        .select('*')
        .eq('user_id', user!.id)
        .order('prediction_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as ChurnPrediction[];
    },
    enabled: !!user,
  });

  // Calculate stats
  const stats: PredictionStats | null = predictions ? (() => {
    const verified = predictions.filter(p => p.outcome_verified);
    const truePositives = verified.filter(p => 
      p.predicted_churn_probability > 0.5 && p.actual_outcome === 'churned'
    ).length;
    const trueNegatives = verified.filter(p => 
      p.predicted_churn_probability <= 0.5 && p.actual_outcome === 'retained'
    ).length;
    const falsePositives = verified.filter(p => 
      p.predicted_churn_probability > 0.5 && p.actual_outcome === 'retained'
    ).length;
    const falseNegatives = verified.filter(p => 
      p.predicted_churn_probability <= 0.5 && p.actual_outcome === 'churned'
    ).length;
    
    const total = truePositives + trueNegatives + falsePositives + falseNegatives;
    const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;
    const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;

    return {
      total_predictions: predictions.length,
      verified_predictions: verified.length,
      true_positives: truePositives,
      true_negatives: trueNegatives,
      false_positives: falsePositives,
      false_negatives: falseNegatives,
      accuracy,
      precision,
      recall,
    };
  })() : null;

  // Prepare chart data
  const accuracyTrend = predictions?.reduce((acc, p) => {
    if (p.accuracy_score != null) {
      const date = format(new Date(p.prediction_date), 'MMM d');
      const existing = acc.find(a => a.date === date);
      if (existing) {
        existing.scores.push(p.accuracy_score);
        existing.accuracy = existing.scores.reduce((a, b) => a + b, 0) / existing.scores.length;
      } else {
        acc.push({ date, accuracy: p.accuracy_score, scores: [p.accuracy_score] });
      }
    }
    return acc;
  }, [] as { date: string; accuracy: number; scores: number[] }[]).reverse() || [];

  const confusionData = stats ? [
    { name: 'True Positives', value: stats.true_positives, color: COLORS.success },
    { name: 'True Negatives', value: stats.true_negatives, color: COLORS.neutral },
    { name: 'False Positives', value: stats.false_positives, color: COLORS.warning },
    { name: 'False Negatives', value: stats.false_negatives, color: COLORS.danger },
  ] : [];

  const riskBreakdown = predictions?.reduce((acc, p) => {
    const level = p.risk_level || 'unknown';
    if (!acc[level]) acc[level] = { total: 0, verified: 0, correct: 0 };
    acc[level].total++;
    if (p.outcome_verified) {
      acc[level].verified++;
      if (p.accuracy_score && p.accuracy_score > 0.5) acc[level].correct++;
    }
    return acc;
  }, {} as Record<string, { total: number; verified: number; correct: number }>) || {};

  if (loadingPredictions) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Prediction Accuracy
        </CardTitle>
        <CardDescription>
          Track and measure the accuracy of churn and risk predictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Prediction History</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {stats ? `${(stats.accuracy * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Overall Accuracy</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {stats ? `${(stats.precision * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Precision</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {stats ? `${(stats.recall * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Recall</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-3xl font-bold">{stats?.verified_predictions || 0}</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </div>

            {/* Confusion Matrix Visualization */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4">Confusion Matrix</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{stats?.true_positives || 0}</div>
                    <div className="text-xs text-muted-foreground">True Positives</div>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-amber-600">{stats?.false_positives || 0}</div>
                    <div className="text-xs text-muted-foreground">False Positives</div>
                  </div>
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{stats?.false_negatives || 0}</div>
                    <div className="text-xs text-muted-foreground">False Negatives</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats?.true_negatives || 0}</div>
                    <div className="text-xs text-muted-foreground">True Negatives</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Distribution</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={confusionData.filter(d => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {confusionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Accuracy by Risk Level */}
            <div>
              <h4 className="font-medium mb-4">Accuracy by Risk Level</h4>
              <div className="space-y-3">
                {Object.entries(riskBreakdown).map(([level, data]) => (
                  <div key={level} className="flex items-center gap-4">
                    <Badge variant={
                      level === 'critical' ? 'destructive' :
                      level === 'high' ? 'default' :
                      level === 'medium' ? 'secondary' : 'outline'
                    } className="w-20 justify-center">
                      {level}
                    </Badge>
                    <div className="flex-1">
                      <Progress 
                        value={data.verified > 0 ? (data.correct / data.verified) * 100 : 0} 
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-24 text-right">
                      {data.correct}/{data.verified} correct
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Accuracy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions?.slice(0, 20).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(p.prediction_date), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        p.risk_level === 'critical' ? 'destructive' :
                        p.risk_level === 'high' ? 'default' :
                        p.risk_level === 'medium' ? 'secondary' : 'outline'
                      }>
                        {p.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.predicted_churn_probability > 0.7 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : p.predicted_churn_probability > 0.4 ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        {(p.predicted_churn_probability * 100).toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.model_used?.split('/')[1] || p.model_used}
                    </TableCell>
                    <TableCell>
                      {p.outcome_verified ? (
                        <Badge variant={p.actual_outcome === 'churned' ? 'destructive' : 'default'}>
                          {p.actual_outcome}
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Pending
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.accuracy_score != null ? (
                        <div className="flex items-center gap-1">
                          {p.accuracy_score > 0.7 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {(p.accuracy_score * 100).toFixed(0)}%
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4 space-y-6">
            <div>
              <h4 className="font-medium mb-4">Accuracy Trend Over Time</h4>
              {accuracyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={accuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip 
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Accuracy']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Not enough verified predictions to show trend
                </div>
              )}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Model Performance Notes</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Predictions are verified after the predicted churn window passes</li>
                <li>• Accuracy improves as more predictions are verified</li>
                <li>• False positives indicate over-prediction of churn risk</li>
                <li>• False negatives indicate missed churn events (more costly)</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
