import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  TrendingUp,
  Brain,
  Users,
  MapPin,
  Briefcase,
  DollarSign,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface IntelligenceAnalyticsDashboardProps {
  profileId?: string;
  className?: string;
}

const EXTRACTION_CATEGORIES = [
  { key: 'intelligence.profession_cues', label: 'Profession', icon: Briefcase, color: '#3b82f6' },
  { key: 'intelligence.wealth_indicators', label: 'Wealth', icon: DollarSign, color: '#10b981' },
  { key: 'intelligence.interests_revealed', label: 'Interests', icon: Heart, color: '#f59e0b' },
  { key: 'intelligence.lifestyle_cues', label: 'Lifestyle', icon: Target, color: '#8b5cf6' },
  { key: 'location_analysis', label: 'Location', icon: MapPin, color: '#ec4899' },
  { key: 'people.faces', label: 'People', icon: Users, color: '#06b6d4' },
];

export function IntelligenceAnalyticsDashboard({ profileId, className }: IntelligenceAnalyticsDashboardProps) {
  const { user } = useAuth();

  // Fetch all analyzed media for the profile (or all if no profileId)
  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['intelligence-analytics', profileId],
    queryFn: async () => {
      let query = supabase
        .from('media')
        .select('id, ai_metadata, ai_generation_status, created_at, profile_id')
        .eq('user_id', user!.id)
        .eq('ai_generation_status', 'completed')
        .not('ai_metadata', 'is', null);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query.limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate extraction metrics
  const metrics = useMemo(() => {
    if (!analysisData?.length) return null;

    const total = analysisData.length;
    
    // Count extractions per category
    const categoryExtractions: Record<string, number> = {};
    const extractionTrend: { date: string; count: number; quality: number }[] = [];
    const dailyData: Record<string, { count: number; totalQuality: number }> = {};
    
    let totalQuality = 0;
    let withIntelligence = 0;
    let withProfession = 0;
    let withWealth = 0;
    let withInterests = 0;
    let withLifestyle = 0;
    let withLocation = 0;
    let withPeople = 0;
    let withRelationshipContext = 0;

    for (const media of analysisData) {
      const metadata = media.ai_metadata as any;
      if (!metadata) continue;

      const date = new Date(media.created_at).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, totalQuality: 0 };
      }
      dailyData[date].count++;

      // Check intelligence extraction
      const intel = metadata.intelligence;
      if (intel) {
        withIntelligence++;
        
        if (intel.profession_cues?.length > 0) {
          withProfession++;
          categoryExtractions['profession'] = (categoryExtractions['profession'] || 0) + 1;
        }
        if (intel.wealth_indicators?.length > 0) {
          withWealth++;
          categoryExtractions['wealth'] = (categoryExtractions['wealth'] || 0) + 1;
        }
        if (intel.interests_revealed?.length > 0) {
          withInterests++;
          categoryExtractions['interests'] = (categoryExtractions['interests'] || 0) + 1;
        }
        if (intel.lifestyle_cues?.length > 0) {
          withLifestyle++;
          categoryExtractions['lifestyle'] = (categoryExtractions['lifestyle'] || 0) + 1;
        }
        if (intel.relationship_context) {
          withRelationshipContext++;
          categoryExtractions['relationship'] = (categoryExtractions['relationship'] || 0) + 1;
        }
      }

      // Check location
      if (metadata.location_analysis?.city_suggested || metadata.location_analysis?.country_suggested) {
        withLocation++;
        categoryExtractions['location'] = (categoryExtractions['location'] || 0) + 1;
      }

      // Check people
      if (metadata.people?.faces?.length > 0) {
        withPeople++;
        categoryExtractions['people'] = (categoryExtractions['people'] || 0) + 1;
      }

      // Calculate quality score for this item
      const fieldsPresent = [
        intel?.profession_cues?.length > 0,
        intel?.wealth_indicators?.length > 0,
        intel?.interests_revealed?.length > 0,
        intel?.lifestyle_cues?.length > 0,
        metadata.location_analysis?.city_suggested,
        metadata.people?.faces?.length > 0,
      ].filter(Boolean).length;
      
      const quality = (fieldsPresent / 6) * 100;
      totalQuality += quality;
      dailyData[date].totalQuality += quality;
    }

    // Build trend data
    const sortedDates = Object.keys(dailyData).sort();
    for (const date of sortedDates.slice(-14)) { // Last 14 days
      const d = dailyData[date];
      extractionTrend.push({
        date: date.split('/').slice(0, 2).join('/'),
        count: d.count,
        quality: Math.round(d.totalQuality / d.count),
      });
    }

    // Category percentages for chart
    const categoryData = [
      { name: 'Profession', value: withProfession, percentage: Math.round((withProfession / total) * 100) },
      { name: 'Wealth', value: withWealth, percentage: Math.round((withWealth / total) * 100) },
      { name: 'Interests', value: withInterests, percentage: Math.round((withInterests / total) * 100) },
      { name: 'Lifestyle', value: withLifestyle, percentage: Math.round((withLifestyle / total) * 100) },
      { name: 'Location', value: withLocation, percentage: Math.round((withLocation / total) * 100) },
      { name: 'People', value: withPeople, percentage: Math.round((withPeople / total) * 100) },
    ];

    return {
      total,
      withIntelligence,
      intelligenceRate: Math.round((withIntelligence / total) * 100),
      avgQuality: Math.round(totalQuality / total),
      categoryData,
      extractionTrend,
      breakdown: {
        profession: { count: withProfession, rate: Math.round((withProfession / total) * 100) },
        wealth: { count: withWealth, rate: Math.round((withWealth / total) * 100) },
        interests: { count: withInterests, rate: Math.round((withInterests / total) * 100) },
        lifestyle: { count: withLifestyle, rate: Math.round((withLifestyle / total) * 100) },
        location: { count: withLocation, rate: Math.round((withLocation / total) * 100) },
        people: { count: withPeople, rate: Math.round((withPeople / total) * 100) },
        relationship: { count: withRelationshipContext, rate: Math.round((withRelationshipContext / total) * 100) },
      },
    };
  }, [analysisData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.total === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center h-48 gap-2">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No analyzed media yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Intelligence Analytics
        </CardTitle>
        <CardDescription>
          Extraction quality and coverage metrics from {metrics.total} analyzed images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Intelligence Rate</span>
            </div>
            <div className="text-2xl font-bold">{metrics.intelligenceRate}%</div>
            <Progress value={metrics.intelligenceRate} className="h-1 mt-2" />
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Avg Quality</span>
            </div>
            <div className="text-2xl font-bold">{metrics.avgQuality}%</div>
            <Progress value={metrics.avgQuality} className="h-1 mt-2" />
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">With Intel</span>
            </div>
            <div className="text-2xl font-bold">{metrics.withIntelligence}</div>
            <p className="text-xs text-muted-foreground">of {metrics.total} images</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Categories</span>
            </div>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">tracked</p>
          </div>
        </div>

        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="mt-4 space-y-3">
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {Object.entries(metrics.breakdown).map(([key, data]) => {
                  const category = EXTRACTION_CATEGORIES.find(c => c.key.includes(key));
                  const Icon = category?.icon || Target;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">{key}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{data.count}</Badge>
                          <span className="text-sm font-bold" style={{ color: category?.color }}>
                            {data.rate}%
                          </span>
                        </div>
                      </div>
                      <Progress value={data.rate} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chart" className="mt-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={metrics.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  labelLine={false}
                >
                  {metrics.categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="trend" className="mt-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={metrics.extractionTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="quality"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Quality %"
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Quality Assessment */}
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            {metrics.avgQuality >= 50 ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            <span className="font-medium">Quality Assessment</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {metrics.avgQuality >= 70 
              ? 'Excellent intelligence extraction. Data quality sufficient for comprehensive dossier generation.'
              : metrics.avgQuality >= 50
              ? 'Good extraction quality. Consider running deep analysis on high-priority images.'
              : metrics.avgQuality >= 30
              ? 'Moderate extraction. Some images may benefit from re-analysis with different settings.'
              : 'Low extraction rate. Check image quality or adjust analysis parameters.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
