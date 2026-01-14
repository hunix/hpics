import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Cpu,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  Calendar,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHardwareAnalytics, type SnapshotType } from '@/hooks/useHardwareAnalytics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

function DeviceHealthCard({ device }: { device: any }) {
  const healthColor = 
    device.health_score >= 80 ? 'text-green-500' :
    device.health_score >= 60 ? 'text-yellow-500' :
    device.health_score >= 40 ? 'text-orange-500' : 'text-red-500';

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{device.device_name}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {device.device_type}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Health</span>
          <span className={`font-medium ${healthColor}`}>
            {Math.round(device.health_score)}%
          </span>
        </div>
        <Progress value={device.health_score} className="h-1.5" />
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div>
            <span className="text-muted-foreground">Captures (24h)</span>
            <div className="font-medium">{device.captures_24h}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Alerts (24h)</span>
            <div className="font-medium">{device.alerts_24h}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HardwareAnalyticsDashboard() {
  const [snapshotType, setSnapshotType] = useState<SnapshotType>('daily');
  const {
    deviceMetrics,
    captureTimeSeries,
    alertTimeSeries,
    aggregateStats,
    isLoading,
    generateSnapshot,
    isGenerating,
  } = useHardwareAnalytics();

  // Prepare pie chart data for alerts
  const alertSeverityData = [
    { name: 'Critical', value: deviceMetrics.reduce((sum, d) => sum + (d.alerts_24h > 3 ? 1 : 0), 0), color: '#ef4444' },
    { name: 'High', value: deviceMetrics.reduce((sum, d) => sum + (d.alerts_24h > 1 && d.alerts_24h <= 3 ? 1 : 0), 0), color: '#f97316' },
    { name: 'Medium', value: deviceMetrics.reduce((sum, d) => sum + (d.alerts_24h === 1 ? 1 : 0), 0), color: '#eab308' },
    { name: 'Low', value: deviceMetrics.reduce((sum, d) => sum + (d.alerts_24h === 0 ? 1 : 0), 0), color: '#22c55e' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Hardware Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Performance metrics and historical analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={snapshotType} onValueChange={(v) => setSnapshotType(v as SnapshotType)}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => generateSnapshot(snapshotType)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Snapshot
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Devices</span>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mt-2">{aggregateStats.totalDevices}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {aggregateStats.activeDevices} online
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Health</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mt-2">
              {Math.round(aggregateStats.avgHealthScore)}%
            </div>
            <Progress value={aggregateStats.avgHealthScore} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Captures (24h)</span>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mt-2">{aggregateStats.captures24h}</div>
            <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Active collection
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Alerts (24h)</span>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mt-2">{aggregateStats.alerts24h}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Across all devices
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uptime</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mt-2">
              {aggregateStats.totalDevices > 0 
                ? Math.round((aggregateStats.activeDevices / aggregateStats.totalDevices) * 100) 
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Fleet availability
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Capture Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Capture Activity (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {captureTimeSeries.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No capture data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={captureTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Alert Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alert Activity (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {alertTimeSeries.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No alert data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={alertTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--destructive))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Health Grid */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Device Health Status</CardTitle>
            <Badge variant="outline">
              {deviceMetrics.length} devices
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : deviceMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cpu className="h-12 w-12 mx-auto mb-3" />
              <p>No devices registered</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {deviceMetrics.map((device) => (
                <DeviceHealthCard key={device.device_id} device={device} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Distribution */}
      {alertSeverityData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Device Alert Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={300} height={200}>
                <PieChart>
                  <Pie
                    data={alertSeverityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {alertSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {alertSeverityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
