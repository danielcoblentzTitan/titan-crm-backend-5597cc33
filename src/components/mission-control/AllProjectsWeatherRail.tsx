import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudRain, Wind, AlertTriangle, MapPin, RefreshCw, Thermometer, CloudSnow, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { formatProjectCode } from '@/lib/project-utils';

interface Project {
  id: string;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  building_type?: string | null;
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
  projects: Project[];
}

export function AllProjectsWeatherRail({ projects }: Props) {
  const [weatherData, setWeatherData] = useState<Record<string, WeatherSnapshot>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadAllWeatherData();
  }, [projects]);

  // Auto-fetch weather for projects with coordinates but no snapshot yet
  useEffect(() => {
    const missing = projects.filter(p => p.latitude && p.longitude && !weatherData[p.id]);
    // Fetch at most 2 in background to avoid rate limits
    missing.slice(0, 2).forEach(p => {
      if (!loading[p.id]) {
        fetchWeatherForProject(p);
      }
    });
  }, [projects, weatherData]);

  const loadAllWeatherData = async () => {
    try {
      const projectIds = projects.map(p => p.id);
      if (projectIds.length === 0) return;

      const { data, error } = await supabase
        .from('weather_snapshots')
        .select('*')
        .in('project_id', projectIds)
        .order('captured_at', { ascending: false });

      if (error) throw error;

      // Get latest snapshot for each project
      const latestSnapshots: Record<string, WeatherSnapshot> = {};
      data?.forEach(snapshot => {
        if (!latestSnapshots[snapshot.project_id]) {
          latestSnapshots[snapshot.project_id] = snapshot as WeatherSnapshot;
        }
      });

      setWeatherData(latestSnapshots);
    } catch (error) {
      console.error('Failed to load weather data:', error);
    }
  };

  const fetchWeatherForProject = async (project: Project) => {
    setLoading(prev => ({ ...prev, [project.id]: true }));
    
    try {
      let lat = project.latitude;
      let lon = project.longitude;

      // If no GPS but we have city/state, try geocoding on the fly
      if ((!lat || !lon) && project.city && project.state) {
        try {
          const query = encodeURIComponent(`${project.city}, ${project.state}`);
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`);
          if (geoRes.ok) {
            const geoJson = await geoRes.json();
            const first = geoJson?.results?.[0];
            if (first?.latitude && first?.longitude) {
              lat = first.latitude;
              lon = first.longitude;
              // Persist coordinates in background via edge function (best-effort)
              supabase.functions.invoke('geocode-project', {
                body: { project_id: project.id, city: project.city, state: project.state, zip: null }
              }).catch(() => {});
            }
          }
        } catch (e) {
          // ignore geocoding failure, we'll handle below
        }
      }

      if (!lat || !lon) {
        toast({
          title: "Missing Location",
          description: `${project.code || project.name} doesn't have GPS coordinates and could not be geocoded`,
          variant: "destructive"
        });
        return;
      }

      // Using Open-Meteo API for free weather data
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,weathercode&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=7`
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
          project_id: project.id,
          forecast_json: forecastData,
          risk_flag: riskFlag,
          notes: null
        });

      if (error) throw error;

      toast({
        title: "Weather Updated",
        description: `Forecast fetched for ${project.code}`,
      });

      // Reload weather data
      loadAllWeatherData();

    } catch (error) {
      console.error('Failed to fetch weather:', error);
      toast({
        title: "Error",
        description: `Failed to fetch weather for ${project.code}`,
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [project.id]: false }));
    }
  };

  const fetchAllWeather = async () => {
    const projectsWithCoords = projects.filter(p => p.latitude && p.longitude);
    
    if (projectsWithCoords.length === 0) {
      toast({
        title: "No Coordinates",
        description: "No projects have GPS coordinates for weather data",
        variant: "destructive"
      });
      return;
    }

    // Process in batches to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < projectsWithCoords.length; i += batchSize) {
      const batch = projectsWithCoords.slice(i, i + batchSize);
      await Promise.all(batch.map(project => fetchWeatherForProject(project)));
      
      // Small delay between batches
      if (i + batchSize < projectsWithCoords.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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

  const getWeatherSummary = (forecast: any) => {
    if (!forecast?.daily) return { maxPrecip: 0, maxWind: 0, maxTemp: 0, minTemp: 0, severeWeather: [] };
    
    const severeWeather = [];
    const weatherCodes = forecast.daily.weathercode || [];
    const maxPrecip = Math.max(...forecast.daily.precipitation_probability_max);
    const maxWind = Math.max(...forecast.daily.wind_speed_10m_max);
    
    // Check for severe weather codes
    weatherCodes.forEach((code: number, index: number) => {
      if (code >= 95) severeWeather.push({ day: index, type: 'Thunderstorm' });
      else if (code >= 85) severeWeather.push({ day: index, type: 'Snow Storm' });
      else if (code >= 80) severeWeather.push({ day: index, type: 'Heavy Rain' });
    });
    
    return {
      maxPrecip,
      maxWind,
      maxTemp: Math.max(...(forecast.daily.temperature_2m_max || [0])),
      minTemp: Math.min(...(forecast.daily.temperature_2m_min || [0])),
      severeWeather,
      dailyData: forecast.daily.time?.map((date: string, index: number) => ({
        date,
        maxTemp: forecast.daily.temperature_2m_max?.[index] || 0,
        minTemp: forecast.daily.temperature_2m_min?.[index] || 0,
        precipitation: forecast.daily.precipitation_probability_max?.[index] || 0,
        wind: forecast.daily.wind_speed_10m_max?.[index] || 0,
        weatherCode: forecast.daily.weathercode?.[index] || 0
      })) || []
    };
  };

  const getWeatherCodeIcon = (code: number) => {
    if (code >= 95) return Zap; // Thunderstorm
    if (code >= 85) return CloudSnow; // Snow
    if (code >= 80) return CloudRain; // Heavy rain
    if (code >= 61) return CloudRain; // Rain
    return Cloud; // Clear/Cloudy
  };

  const getWeatherCodeColor = (code: number) => {
    if (code >= 95) return 'text-purple-500'; // Thunderstorm
    if (code >= 85) return 'text-blue-300'; // Snow
    if (code >= 80) return 'text-blue-600'; // Heavy rain
    if (code >= 61) return 'text-blue-400'; // Rain
    return 'text-gray-400'; // Clear/Cloudy
  };

  return (
    <Card>
      <CardHeader className="py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Cloud className="h-4 w-4" />
            7-Day Weather
          </CardTitle>
          <Button 
            onClick={fetchAllWeather} 
            size="sm" 
            variant="ghost"
            disabled={Object.values(loading).some(Boolean)}
            className="h-7 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        {projects.length === 0 ? (
          <div className="text-center py-2 text-muted-foreground text-xs">
            No active projects
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {projects.map(project => {
              const weather = weatherData[project.id];
              const isLoading = loading[project.id];
              const summary = weather ? getWeatherSummary(weather.forecast_json) : null;
              
              return (
                <div key={project.id} className="flex-shrink-0 border rounded p-2 min-w-[240px] space-y-2">
                  {/* Project Info - Compact */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{formatProjectCode(project.code, project.building_type) || project.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{project.city}, {project.state}</span>
                      </div>
                    </div>
                    {weather && (
                      <Badge className={`${getRiskColor(weather.risk_flag)} text-white border-none text-[10px] px-1.5 py-0 h-4`}>
                        {weather.risk_flag}
                      </Badge>
                    )}
                  </div>

                  {/* Weather Summary - Compact */}
                  {weather && summary ? (
                    <>
                      {/* Current Temp & Severe Weather */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-2.5 w-2.5" />
                          <span>{Math.round(summary.maxTemp)}°/{Math.round(summary.minTemp)}°F</span>
                        </div>
                        {summary.severeWeather.length > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span>Alert</span>
                          </div>
                        )}
                      </div>

                      {/* 5-Day Compact View */}
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {summary.dailyData
                          .filter(day => {
                            // Only show future days (today onwards)
                            const dayDate = new Date(day.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            dayDate.setHours(0, 0, 0, 0);
                            
                            // Must be today or future
                            if (dayDate < today) return false;
                            
                            // Only show workdays (Mon-Fri)
                            const dayOfWeek = dayDate.getDay();
                            return dayOfWeek !== 0 && dayOfWeek !== 6;
                          })
                          .slice(0, 5)
                          .map((day, index) => {
                            const WeatherIcon = getWeatherCodeIcon(day.weatherCode);
                            const weatherColor = getWeatherCodeColor(day.weatherCode);
                            const dayName = format(new Date(day.date), 'EEE').slice(0, 1);
                            
                            return (
                              <div key={index} className="space-y-0.5">
                                <div className="text-[9px] text-muted-foreground">{dayName}</div>
                                <WeatherIcon className={`h-2.5 w-2.5 mx-auto ${weatherColor}`} />
                                <div className="text-[9px] font-medium">{Math.round(day.maxTemp)}°</div>
                                <div className="text-[8px] text-blue-500">{day.precipitation}%</div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Key Stats - Inline */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CloudRain className="h-2.5 w-2.5 text-blue-500" />
                          <span>{summary.maxPrecip}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind className="h-2.5 w-2.5 text-orange-500" />
                          <span>{Math.round(summary.maxWind)}mph</span>
                        </div>
                        <Button 
                          onClick={() => fetchWeatherForProject(project)}
                          size="sm"
                          variant="ghost"
                          className="h-4 px-1 text-[9px]"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-2.5 w-2.5" />
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button 
                      onClick={() => fetchWeatherForProject(project)}
                      size="sm"
                      variant="outline"
                      className="w-full text-[10px] h-5"
                      disabled={isLoading || !project.latitude || !project.longitude}
                    >
                      {isLoading ? 'Loading...' : !project.latitude ? 'No GPS' : 'Fetch'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}