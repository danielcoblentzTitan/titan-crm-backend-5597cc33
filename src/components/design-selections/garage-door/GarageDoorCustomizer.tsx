import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoorStyleSelector } from "./DoorStyleSelector";
import { DoorColorSelector } from "./DoorColorSelector";
import { WindowSelector } from "./WindowSelector";
import { HardwareSelector } from "./HardwareSelector";
import { GarageDoorSummary } from "./GarageDoorSummary";

interface GarageDoorCustomizerProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
}

export const GarageDoorCustomizer = ({ selections, setSelections, isEditing }: GarageDoorCustomizerProps) => {
  return (
    <div className="space-y-6">
      {/* Persistent Summary Box */}
      <GarageDoorSummary selections={selections} />
      
      <Tabs defaultValue="style" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="windows">Window Style</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
        </TabsList>

        <TabsContent value="style">
          <DoorStyleSelector
            selections={selections}
            setSelections={setSelections}
            isEditing={isEditing}
          />
        </TabsContent>

        <TabsContent value="colors">
          <DoorColorSelector
            selections={selections}
            setSelections={setSelections}
            isEditing={isEditing}
          />
        </TabsContent>

        <TabsContent value="windows">
          <WindowSelector
            selections={selections}
            setSelections={setSelections}
            isEditing={isEditing}
          />
        </TabsContent>

        <TabsContent value="hardware">
          <HardwareSelector
            selections={selections}
            setSelections={setSelections}
            isEditing={isEditing}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
};