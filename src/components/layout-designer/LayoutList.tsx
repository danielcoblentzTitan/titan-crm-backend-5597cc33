import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BuildingLayout {
  id: string;
  name: string;
  building_width: number;
  building_length: number;
  created_at: string;
  updated_at: string;
  notes?: string;
}

interface LayoutListProps {
  layouts: BuildingLayout[];
  onLoadLayout: (layoutId: string) => void;
  onDeleteLayout: (layoutId: string) => void;
  currentLayoutId: string | null;
}

export const LayoutList: React.FC<LayoutListProps> = ({
  layouts,
  onLoadLayout,
  onDeleteLayout,
  currentLayoutId,
}) => {
  if (layouts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No saved layouts yet</p>
          <p className="text-sm">Create and save your first building layout to see it here.</p>
        </div>
      </div>
    );
  }

  const handleDelete = (layoutId: string, layoutName: string) => {
    if (window.confirm(`Are you sure you want to delete "${layoutName}"?`)) {
      onDeleteLayout(layoutId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Layouts</h3>
        <Badge variant="secondary">{layouts.length} layout{layouts.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div className="grid gap-4">
        {layouts.map((layout) => (
          <Card 
            key={layout.id} 
            className={`hover:shadow-md transition-shadow ${
              currentLayoutId === layout.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{layout.name}</CardTitle>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>
                      {layout.building_width}' × {layout.building_length}'
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(layout.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadLayout(layout.id)}
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Load
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(layout.id, layout.name)}
                    className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {layout.notes && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{layout.notes}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};