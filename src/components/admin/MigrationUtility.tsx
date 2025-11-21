import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, RefreshCw, AlertCircle } from "lucide-react";
import { backfillAllProjects, analyzeProjectForStandardization } from "@/utils/migrationHelpers";
import { Badge } from "@/components/ui/badge";

interface MigrationUtilityProps {
  projectId?: string;
}

export const MigrationUtility = ({ projectId }: MigrationUtilityProps) => {
  const { toast } = useToast();
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleBackfillAll = async () => {
    setIsBackfilling(true);
    try {
      const results = await backfillAllProjects();
      
      toast({
        title: "Backfill Complete",
        description: `Successfully backfilled ${results.successful} projects. ${results.failed} failed.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to backfill projects",
        variant: "destructive"
      });
    } finally {
      setIsBackfilling(false);
    }
  };

  const handleAnalyzeProject = async () => {
    if (!projectId) return;
    
    setIsAnalyzing(true);
    try {
      const results = await analyzeProjectForStandardization(projectId);
      setAnalysisResults(results);
      
      toast({
        title: "Analysis Complete",
        description: `Found ${results.suggestions.length} items that could be standardized`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze project",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migration Utilities
          </CardTitle>
          <CardDescription>
            Tools for backfilling master selections and analyzing existing projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Backfill All Projects</h4>
            <p className="text-sm text-muted-foreground">
              Creates master interior and exterior selections for all projects that don't have them
            </p>
            <Button
              onClick={handleBackfillAll}
              disabled={isBackfilling}
              variant="secondary"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isBackfilling ? 'animate-spin' : ''}`} />
              {isBackfilling ? 'Backfilling...' : 'Backfill All Projects'}
            </Button>
          </div>

          {projectId && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-medium">Analyze Current Project</h4>
              <p className="text-sm text-muted-foreground">
                Identifies selections that appear consistently across rooms and could be standardized
              </p>
              <Button
                onClick={handleAnalyzeProject}
                disabled={isAnalyzing}
                variant="outline"
              >
                <AlertCircle className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Project'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{analysisResults.totalRooms}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Selections</p>
                <p className="text-2xl font-bold">{analysisResults.totalSelections}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Standardization Opportunities</p>
                <p className="text-2xl font-bold text-primary">{analysisResults.suggestions.length}</p>
              </div>
            </div>

            {analysisResults.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Standardization Suggestions</h4>
                <div className="space-y-2">
                  {analysisResults.suggestions.map((suggestion: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{suggestion.label}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                      </div>
                      <Badge>
                        {suggestion.occurrences} rooms
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
