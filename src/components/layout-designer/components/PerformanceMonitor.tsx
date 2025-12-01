import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, Clock, Zap, HardDrive, Cpu } from 'lucide-react';

interface PerformanceMetrics {
  canvasObjects: number;
  renderTime: number;
  memoryUsage: number;
  fps: number;
  lastUpdate: number;
}

interface PerformanceMonitorProps {
  canvas: any;
  elements: any[];
  isVisible: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  canvas,
  elements,
  isVisible
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    canvasObjects: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 60,
    lastUpdate: Date.now()
  });

  const [optimizations, setOptimizations] = useState({
    enableObjectCaching: true,
    enableVirtualization: false,
    reduceRenderQuality: false,
    limitUndoHistory: true
  });

  // Monitor performance metrics
  useEffect(() => {
    if (!canvas || !isVisible) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = now - metrics.lastUpdate;
      
      // Calculate FPS
      const fps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 60;
      
      // Get canvas object count
      const canvasObjects = canvas.getObjects ? canvas.getObjects().length : 0;
      
      // Estimate memory usage (rough calculation)
      const memoryUsage = canvasObjects * 0.5 + elements.length * 0.1; // MB estimate
      
      // Measure render time (simplified)
      const renderStart = performance.now();
      canvas.renderAll && canvas.renderAll();
      const renderTime = performance.now() - renderStart;

      setMetrics({
        canvasObjects,
        renderTime,
        memoryUsage,
        fps: Math.min(fps, 60),
        lastUpdate: now
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [canvas, elements, isVisible, metrics.lastUpdate]);

  // Apply performance optimizations
  const applyOptimizations = () => {
    if (!canvas) return;

    if (optimizations.enableObjectCaching) {
      // Enable object caching for better performance
      canvas.getObjects().forEach((obj: any) => {
        obj.objectCaching = true;
      });
    }

    if (optimizations.reduceRenderQuality) {
      // Reduce rendering quality for better performance
      canvas.enableRetinaScaling = false;
    }

    canvas.renderAll();
  };

  const getPerformanceStatus = () => {
    if (metrics.canvasObjects > 500 || metrics.renderTime > 16) {
      return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    } else if (metrics.canvasObjects > 1000 || metrics.renderTime > 32) {
      return { status: 'critical', color: 'text-red-600', icon: AlertTriangle };
    }
    return { status: 'good', color: 'text-green-600', icon: CheckCircle };
  };

  const performanceStatus = getPerformanceStatus();
  const StatusIcon = performanceStatus.icon;

  if (!isVisible) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Monitor
          </CardTitle>
          <div className="flex items-center gap-1">
            <StatusIcon className={`h-4 w-4 ${performanceStatus.color}`} />
            <Badge 
              variant={performanceStatus.status === 'good' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {performanceStatus.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Real-time Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <Cpu className="h-3 w-3" />
              <span>Objects</span>
            </div>
            <div className="text-lg font-bold">{metrics.canvasObjects}</div>
            <Progress 
              value={(metrics.canvasObjects / 1000) * 100} 
              className="h-1" 
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span>Render Time</span>
            </div>
            <div className="text-lg font-bold">{metrics.renderTime.toFixed(1)}ms</div>
            <Progress 
              value={(metrics.renderTime / 16) * 100} 
              className="h-1" 
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <HardDrive className="h-3 w-3" />
              <span>Memory</span>
            </div>
            <div className="text-lg font-bold">{metrics.memoryUsage.toFixed(1)}MB</div>
            <Progress 
              value={(metrics.memoryUsage / 100) * 100} 
              className="h-1" 
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <Cpu className="h-3 w-3" />
              <span>FPS</span>
            </div>
            <div className="text-lg font-bold">{metrics.fps}</div>
            <Progress 
              value={(metrics.fps / 60) * 100} 
              className="h-1" 
            />
          </div>
        </div>

        <Separator />

        {/* Optimization Controls */}
        <div>
          <h4 className="text-sm font-medium mb-2">Performance Optimizations</h4>
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs">
              <span>Object Caching</span>
              <input
                type="checkbox"
                checked={optimizations.enableObjectCaching}
                onChange={(e) => setOptimizations(prev => ({
                  ...prev,
                  enableObjectCaching: e.target.checked
                }))}
                className="scale-75"
              />
            </label>
            
            <label className="flex items-center justify-between text-xs">
              <span>Canvas Virtualization</span>
              <input
                type="checkbox"
                checked={optimizations.enableVirtualization}
                onChange={(e) => setOptimizations(prev => ({
                  ...prev,
                  enableVirtualization: e.target.checked
                }))}
                className="scale-75"
              />
            </label>
            
            <label className="flex items-center justify-between text-xs">
              <span>Reduce Quality</span>
              <input
                type="checkbox"
                checked={optimizations.reduceRenderQuality}
                onChange={(e) => setOptimizations(prev => ({
                  ...prev,
                  reduceRenderQuality: e.target.checked
                }))}
                className="scale-75"
              />
            </label>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={applyOptimizations}
            className="w-full mt-2"
          >
            Apply Optimizations
          </Button>
        </div>

        {/* Performance Tips */}
        <div>
          <h4 className="text-sm font-medium mb-2">Tips</h4>
          <ScrollArea className="h-20">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Keep objects under 500 for smooth performance</p>
              <p>• Group similar elements to reduce render calls</p>
              <p>• Use lower resolution for large layouts</p>
              <p>• Clear unused elements regularly</p>
              <p>• Enable object caching for static elements</p>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper hook for performance optimization
export const usePerformanceOptimization = (canvas: any, threshold: number = 500) => {
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    if (!canvas) return;

    const checkPerformance = () => {
      const objectCount = canvas.getObjects().length;
      
      if (objectCount > threshold && !isOptimized) {
        // Auto-enable optimizations
        canvas.getObjects().forEach((obj: any) => {
          obj.objectCaching = true;
        });
        setIsOptimized(true);
      }
    };

    const interval = setInterval(checkPerformance, 2000);
    return () => clearInterval(interval);
  }, [canvas, threshold, isOptimized]);

  return { isOptimized };
};