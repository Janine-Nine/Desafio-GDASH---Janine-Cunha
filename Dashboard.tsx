import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, type WeatherLog, type Insight } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets, 
  Download,
  Zap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: weatherLogs = [], isLoading: logsLoading } = useQuery<WeatherLog[]>({
    queryKey: ["weatherLogs"],
    queryFn: () => apiClient.getWeatherLogs(),
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: insights = [], isLoading: insightsLoading } = useQuery<Insight[]>({
    queryKey: ["insights"],
    queryFn: () => apiClient.getInsights(5),
    refetchInterval: 60000,
  });

  const current = weatherLogs[0] || {
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    precipitationProb: 0,
    condition: "N/A",
    location: "N/A"
  };

  const chartData = weatherLogs.slice(0, 12).reverse().map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: log.temperature,
    rain: log.precipitationProb
  }));

  const handleExportCSV = async () => {
    try {
      await apiClient.exportCSV();
      toast({
        title: "Export successful",
        description: "Weather data exported as CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export data",
        variant: "destructive",
      });
    }
  };

  const handleExportXLSX = async () => {
    try {
      await apiClient.exportXLSX();
      toast({
        title: "Export successful",
        description: "Weather data exported as XLSX",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export data",
        variant: "destructive",
      });
    }
  };

  if (logsLoading || insightsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Weather Dashboard</h1>
            <p className="text-muted-foreground">Real-time monitoring and AI-driven insights for {current.location}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportCSV} data-testid="button-export-csv">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleExportXLSX} data-testid="button-export-xlsx">
              <Download className="h-4 w-4" />
              Export XLSX
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-temperature">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="value-temperature">{current.temperature}°C</div>
              <p className="text-xs text-muted-foreground">Feels like {current.temperature + 2}°C</p>
            </CardContent>
          </Card>
          <Card data-testid="card-humidity">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="value-humidity">{current.humidity}%</div>
              <p className="text-xs text-muted-foreground">Dew point {current.temperature - 5}°C</p>
            </CardContent>
          </Card>
          <Card data-testid="card-wind">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wind Speed</CardTitle>
              <Wind className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="value-wind">{current.windSpeed} km/h</div>
              <p className="text-xs text-muted-foreground">Direction: NW</p>
            </CardContent>
          </Card>
          <Card data-testid="card-precipitation">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precipitation</CardTitle>
              <CloudRain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="value-precipitation">{current.precipitationProb}%</div>
              <p className="text-xs text-muted-foreground">Condition: {current.condition}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Temperature History</CardTitle>
              <CardDescription>Recent temperature trend analysis</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}°`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTemp)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-sidebar-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <CardTitle className="text-sidebar-foreground">AI Insights</CardTitle>
              </div>
              <CardDescription className="text-sidebar-foreground/70">
                Smart analysis based on weather patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {insights.length === 0 ? (
                <p className="text-sm text-sidebar-foreground/60">No insights available yet. Data is being collected...</p>
              ) : (
                insights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    data-testid={`insight-${insight.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className={
                          insight.severity === 'high' ? 'border-red-500 text-red-400' : 
                          insight.severity === 'medium' ? 'border-yellow-500 text-yellow-400' : 
                          'border-emerald-500 text-emerald-400'
                        }
                      >
                        {insight.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-sidebar-foreground/50">
                        {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-sidebar-foreground/80 leading-snug">
                      {insight.description}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Weather Logs</CardTitle>
            <CardDescription>Latest data points received from sensors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weatherLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No weather data available yet. The collector is gathering data...</p>
              ) : (
                weatherLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center p-3 rounded-md hover:bg-muted/50 transition-colors border-b last:border-0 border-border/50" data-testid={`log-${log.id}`}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{new Date(log.timestamp).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-muted-foreground" />
                      {log.temperature}°C
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Droplets className="h-4 w-4 text-muted-foreground" />
                      {log.humidity}%
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wind className="h-4 w-4 text-muted-foreground" />
                      {log.windSpeed} km/h
                    </div>
                    <div className="flex items-center justify-end">
                      <Badge variant="secondary">{log.condition}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
