import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Cloud, CloudRain, Wind, AlertTriangle, MapPin, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

interface Project {
  id: string;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface WeatherSnapshot {
  id: string;
  project_id: string;
  captured_at: string;
  forecast_json: any;
  risk_flag: 'None' | 'Rain' | 'High Wind' | 'Storm';
  notes: string | null;
}

interface Props {
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  projects: Project[];
}

export function WeatherRail({ selectedProject, onProjectSelect, projects }: Props) {
  const [weatherData, setWeatherData] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (selectedProject) {
      loadWeatherData(selectedProject.id);
    }
  }, [selectedProject]);

  const loadWeatherData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('weather_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setWeatherData(data as WeatherSnapshot);
      setNotes(data?.notes || '');
    } catch (error) {
      console.error('Failed to load weather data:', error);
    }
  };

  const fetchWeatherForecast = async () => {
    if (!selectedProject || !selectedProject.latitude || !selectedProject.longitude) {
      toast({
        title: "Missing Location",
        description: "This project doesn't have GPS coordinates for weather data",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Using Open-Meteo API for free weather data
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${selectedProject.latitude}&longitude=${selectedProject.longitude}&daily=precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&timezone=America/New_York&forecast_days=7`
      );
      
      if (!response.ok) throw new Error('Failed to fetch weather data');
      
      const forecastData = await response.json();
      
      // Analyze risk
      let riskFlag: 'None' | 'Rain' | 'High Wind' | 'Storm' = 'None';
      const maxPrecip = Math.max(...forecastData.daily.precipitation_probability_max);
      const maxWind = Math.max(...forecastData.daily.wind_speed_10m_max);
      const maxGusts = Math.max(...forecastData.daily.wind_gusts_10m_max);
      
      if (maxPrecip >= 70 && maxWind >= 25) {
        riskFlag = 'Storm';
      } else if (maxWind >= 25 || maxGusts >= 35) {
        riskFlag = 'High Wind';
      } else if (maxPrecip >= 50) {
        riskFlag = 'Rain';
      }

      // Save to database
      const { error } = await supabase
        .from('weather_snapshots')
        .insert({
          project_id: selectedProject.id,
          forecast_json: forecastData,
          risk_flag: riskFlag,
          notes: notes || null
        });

      if (error) throw error;

      toast({
        title: "Weather Updated",
        description: `Forecast fetched for ${selectedProject.code}`,
      });

      // Reload weather data
      loadWeatherData(selectedProject.id);

    } catch (error) {
      console.error('Failed to fetch weather:', error);
      toast({
        title: "Error",
        description: "Failed to fetch weather forecast",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!weatherData) return;

    try {
      const { error } = await supabase
        .from('weather_snapshots')
        .update({ notes })
        .eq('id', weatherData.id);

      if (error) throw error;

      toast({
        title: "Notes Saved",
        description: "Weather notes updated successfully"
      });

      setWeatherData(prev => prev ? { ...prev, notes } : null);
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Storm': return 'bg-purple-500';
      case 'High Wind': return 'bg-orange-500';
      case 'Rain': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Storm': return AlertTriangle;
      case 'High Wind': return Wind;
      case 'Rain': return CloudRain;
      default: return Cloud;
    }
  };

  const formatForecastData = (forecast: any) => {
    if (!forecast?.daily) return [];

    return forecast.daily.time.map((date: string, index: number) => ({
      date,
      precipitation: forecast.daily.precipitation_probability_max[index],
      windSpeed: forecast.daily.wind_speed_10m_max[index],
      windGusts: forecast.daily.wind_gusts_10m_max[index]
    }));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather Rail
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Selector */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Select Project:</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {projects.map(project => (
              <Button
                key={project.id}
                variant={selectedProject?.id === project.id ? "default" : "ghost"}
                className="w-full justify-start text-left h-auto p-2"
                onClick={() => onProjectSelect(project)}
              >
                <div className="text-xs">
                  <div className="font-medium">{project.code}</div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.city || 'Unknown'}, {project.state || 'Unknown'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {selectedProject ? (
          <div className="space-y-4">
            {/* Project Info */}
            <div className="border rounded p-3">
              <div className="font-medium">{selectedProject.code}</div>
              <div className="text-sm text-muted-foreground">{selectedProject.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {selectedProject.city || 'Unknown'}, {selectedProject.state || 'Unknown'}
              </div>
            </div>

            {/* Fetch Weather Button */}
            <Button 
              onClick={fetchWeatherForecast} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch 7-Day Forecast
                </>
              )}
            </Button>

            {weatherData && (
              <Tabs defaultValue="forecast" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="forecast">Forecast</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="forecast" className="space-y-3">
                  {/* Risk Summary */}
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Risk Assessment</div>
                      <Badge className={`${getRiskColor(weatherData.risk_flag)} text-white border-none`}>
                        {weatherData.risk_flag}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last updated: {format(new Date(weatherData.captured_at), 'MMM d, h:mm a')}
                    </div>
                  </div>

                  {/* 7-Day Forecast */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">7-Day Details</div>
                    <div className="space-y-1">
                      {formatForecastData(weatherData.forecast_json).map((day, index) => {
                        const RiskIcon = getRiskIcon(
                          day.precipitation >= 70 && day.windSpeed >= 25 ? 'Storm' :
                          day.windSpeed >= 25 || day.windGusts >= 35 ? 'High Wind' :
                          day.precipitation >= 50 ? 'Rain' : 'None'
                        );

                        return (
                          <div key={index} className="flex items-center justify-between p-2 border rounded text-xs">
                            <div className="flex items-center gap-2">
                              <RiskIcon className="h-3 w-3" />
                              <span>{format(new Date(day.date), 'EEE MMM d')}</span>
                            </div>
                            <div className="text-right">
                              <div>Rain: {day.precipitation}%</div>
                              <div>Wind: {Math.round(day.windSpeed)}mph</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">PM Weather Notes</div>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about weather impact on this project..."
                      rows={4}
                    />
                    <Button onClick={saveNotes} size="sm" className="w-full">
                      Save Notes
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {!weatherData && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No weather data available.<br />
                Click "Fetch Forecast" to get started.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Select a project to view weather forecast
          </div>
        )}
      </CardContent>
    </Card>
  );
}