import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateTradePDF, RoomData } from "@/utils/tradePdfGenerator";

const TRADES = [
  "Plumbing",
  "Electrical",
  "Flooring",
  "Cabinets & Countertops",
  "Paint",
  "Trim",
  "HVAC",
  "Windows & Doors",
  "Exterior",
  "Tile",
  "Garage",
];

export default function TradeViewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [selectedTrade, setSelectedTrade] = useState<string>(TRADES[0]);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: selectionsByRoom, isLoading } = useQuery<RoomData[]>({
    queryKey: ["trade-selections", projectId, selectedTrade],
    queryFn: async () => {
      const { data: selections, error } = await supabase
        .from("selection_items")
        .select(`
          *,
          room:rooms(room_name, sort_order),
          category:selection_categories(name)
        `)
        .eq("project_id", projectId)
        .eq("trade", selectedTrade)
        .order("room_id");
      
      if (error) throw error;

      // Group by room
      const grouped = selections.reduce((acc: Record<string, RoomData>, item: any) => {
        const roomId = item.room_id;
        if (!acc[roomId]) {
          acc[roomId] = {
            room: item.room,
            items: [],
          };
        }
        acc[roomId].items.push(item);
        return acc;
      }, {});

      // Sort by room sort_order
      return Object.values(grouped).sort((a, b) => {
        return (a.room?.sort_order || 0) - (b.room?.sort_order || 0);
      });
    },
    enabled: !!projectId,
  });

  const handleGeneratePDF = () => {
    if (!project || !selectionsByRoom) return;
    
    generateTradePDF(
      {
        name: project.project_name,
        number: project.project_number || "",
        customerName: project.client_name,
      },
      selectedTrade,
      selectionsByRoom
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/project/${projectId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Trade Views</h1>
              <p className="text-muted-foreground mt-1">
                {project?.project_name} - {project?.project_number}
              </p>
            </div>
          </div>
          
          <Button onClick={handleGeneratePDF} disabled={!selectionsByRoom || selectionsByRoom.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Trade Packet PDF
          </Button>
        </div>

        {/* Trade Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTrade} onValueChange={setSelectedTrade}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRADES.map((trade) => (
                  <SelectItem key={trade} value={trade}>
                    {trade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Selections by Room */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading selections...</div>
        ) : !selectionsByRoom || selectionsByRoom.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No selections found for {selectedTrade}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {selectionsByRoom.map((roomData: any) => (
              <Card key={roomData.room.room_name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {roomData.room.room_name}
                    <Badge variant="secondary">{roomData.items.length} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {roomData.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{item.label}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          {item.is_upgrade && (
                            <Badge variant="default">Upgrade</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {item.material_type && (
                            <div>
                              <span className="text-muted-foreground">Material:</span>
                              <p className="font-medium">{item.material_type}</p>
                            </div>
                          )}
                          {item.brand && (
                            <div>
                              <span className="text-muted-foreground">Brand:</span>
                              <p className="font-medium">{item.brand}</p>
                            </div>
                          )}
                          {item.model_or_sku && (
                            <div>
                              <span className="text-muted-foreground">SKU:</span>
                              <p className="font-medium">{item.model_or_sku}</p>
                            </div>
                          )}
                          {item.color_name && (
                            <div>
                              <span className="text-muted-foreground">Color:</span>
                              <p className="font-medium">{item.color_name}</p>
                            </div>
                          )}
                          {item.finish && (
                            <div>
                              <span className="text-muted-foreground">Finish:</span>
                              <p className="font-medium">{item.finish}</p>
                            </div>
                          )}
                          {item.quantity && (
                            <div>
                              <span className="text-muted-foreground">Quantity:</span>
                              <p className="font-medium">
                                {item.quantity} {item.unit || ""}
                              </p>
                            </div>
                          )}
                        </div>

                        {item.notes_for_sub && (
                          <div className="bg-muted p-3 rounded mt-3">
                            <p className="text-sm font-medium text-foreground">Notes for Sub:</p>
                            <p className="text-sm text-muted-foreground mt-1">{item.notes_for_sub}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
