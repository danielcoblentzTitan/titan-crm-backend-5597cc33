import { GarageDoorCustomizer } from "./garage-door/GarageDoorCustomizer";

interface GarageDoorSectionProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
}

export const GarageDoorSection = ({ selections, setSelections, isEditing }: GarageDoorSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Garage Door Selection</h2>
        <p className="text-muted-foreground">
          Customize your garage door with our interactive designer.
        </p>
      </div>

      <GarageDoorCustomizer
        selections={selections}
        setSelections={setSelections}
        isEditing={isEditing}
      />
    </div>
  );
};