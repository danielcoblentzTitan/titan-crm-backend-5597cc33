import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

interface Version {
  id: string;
  version_number: number;
  created_at: string;
}

interface VersionHistoryProps {
  versions: Version[];
}

export const VersionHistory = ({ versions }: VersionHistoryProps) => {
  if (versions.length <= 1) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Version History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {versions.map((version) => (
            <div key={version.id} className="flex items-center justify-between p-2 border rounded">
              <span>Version {version.version_number}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(version.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};