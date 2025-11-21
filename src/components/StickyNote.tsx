import { useState } from "react";
import { X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { StickyNote as StickyNoteType } from "@/services/stickyNotesService";

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  customers?: { id: string; name: string }[];
  teamMembers?: { id: string; name: string }[];
}

const colorClasses = {
  yellow: "bg-yellow-200 border-yellow-300 text-yellow-900",
  blue: "bg-blue-200 border-blue-300 text-blue-900",
  green: "bg-green-200 border-green-300 text-green-900",
  pink: "bg-pink-200 border-pink-300 text-pink-900",
  purple: "bg-purple-200 border-purple-300 text-purple-900",
  orange: "bg-orange-200 border-orange-300 text-orange-900"
};

export const StickyNote = ({ note, onUpdate, onDelete, customers = [], teamMembers = [] }: StickyNoteProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(note.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const getAttachedToName = () => {
    if (note.attached_to_type === 'customer') {
      const customer = customers.find(c => c.id === note.attached_to_id);
      return customer ? `Customer: ${customer.name}` : 'Unknown Customer';
    } else if (note.attached_to_type === 'team_member') {
      const member = teamMembers.find(m => m.id === note.attached_to_id);
      return member ? `Team: ${member.name}` : 'Unknown Team Member';
    }
    return null;
  };

  const colorClass = colorClasses[note.color as keyof typeof colorClasses] || colorClasses.yellow;
  
  // Generate consistent rotation angle based on note ID
  const rotations = ['rotate-[-3deg]', 'rotate-[1deg]', 'rotate-[-2deg]', 'rotate-[2deg]', 'rotate-[-1deg]', 'rotate-[3deg]'];
  const rotationIndex = note.id.charCodeAt(0) % rotations.length;
  const rotationClass = rotations[rotationIndex];

  return (
    <Card className={`relative p-4 w-64 h-48 ${colorClass} border-2 shadow-md transform ${rotationClass} hover:rotate-0 transition-transform duration-200`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          {getAttachedToName() && (
            <div className="text-xs font-semibold mb-1 opacity-75">
              {getAttachedToName()}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-black/10"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-500/20"
            onClick={() => onDelete(note.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 h-32">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 resize-none border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
              placeholder="Enter your note..."
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSave} className="h-6 text-xs">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-6 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-hidden">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {note.content}
            </p>
          </div>
        )}
      </div>

      <div className="absolute bottom-1 right-2 text-xs opacity-50">
        {new Date(note.created_at).toLocaleDateString()}
      </div>
    </Card>
  );
};