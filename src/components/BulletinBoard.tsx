import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { StickyNote } from "./StickyNote";
import { stickyNotesService, StickyNote as StickyNoteType, CreateStickyNote } from "@/services/stickyNotesService";
import { supabaseService } from "@/services/supabaseService";

interface BulletinBoardProps {
  attachedToType?: 'customer' | 'team_member';
  attachedToId?: string;
  title?: string;
}

const noteColors = [
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-200' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-200' },
  { value: 'green', label: 'Green', class: 'bg-green-200' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-200' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-200' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-200' }
];

export const BulletinBoard = ({ attachedToType, attachedToId, title = "Bulletin Board" }: BulletinBoardProps) => {
  const [notes, setNotes] = useState<StickyNoteType[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New note form state
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("yellow");
  const [newNoteAttachToType, setNewNoteAttachToType] = useState<string>("");
  const [newNoteAttachToId, setNewNoteAttachToId] = useState<string>("");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [attachedToType, attachedToId]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading bulletin board data...', { attachedToType, attachedToId });
      
      // Load sticky notes
      const notesData = await stickyNotesService.getStickyNotes(attachedToType, attachedToId);
      console.log('Loaded notes:', notesData);
      setNotes(notesData);
      
      // Load customers and team members for attachment options
      const [customersData, teamMembersData] = await Promise.all([
        supabaseService.getCustomers(),
        supabaseService.getTeamMembers()
      ]);
      
      setCustomers(customersData.map(c => ({ id: c.id, name: c.name })));
      setTeamMembers(teamMembersData.map(t => ({ id: t.id, name: t.name })));
      
    } catch (error) {
      console.error('Error loading bulletin board data:', error);
      toast({
        title: "Error",
        description: "Failed to load bulletin board",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter note content",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create notes",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Creating note with user:', user.id);
      const noteData: CreateStickyNote = {
        content: newNoteContent.trim(),
        color: newNoteColor,
        attached_to_type: (newNoteAttachToType === "none" ? null : newNoteAttachToType) || attachedToType || null,
        attached_to_id: (newNoteAttachToType === "none" ? null : newNoteAttachToId) || attachedToId || null,
        created_by: user.id,
      };

      console.log('Note data being created:', noteData);
      const newNote = await stickyNotesService.createStickyNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      
      // Reset form
      setNewNoteContent("");
      setNewNoteColor("yellow");
      setNewNoteAttachToType("");
      setNewNoteAttachToId("");
      setIsCreating(false);
      
      toast({
        title: "Success",
        description: "Sticky note created!"
      });
      
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    }
  };

  const handleUpdateNote = async (id: string, content: string) => {
    try {
      const updatedNote = await stickyNotesService.updateStickyNote(id, { content });
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      
      toast({
        title: "Success",
        description: "Note updated!"
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await stickyNotesService.deleteStickyNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
      
      toast({
        title: "Success",
        description: "Note deleted!"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Sticky Note</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter your note content..."
                  rows={4}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2">
                  {noteColors.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                        newNoteColor === color.value ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      onClick={() => setNewNoteColor(color.value)}
                    />
                  ))}
                </div>
              </div>
              
              {!attachedToType && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Attach to (Optional)</label>
                    <Select value={newNoteAttachToType} onValueChange={setNewNoteAttachToType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="team_member">Team Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newNoteAttachToType === 'customer' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Customer</label>
                      <Select value={newNoteAttachToId} onValueChange={setNewNoteAttachToId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {newNoteAttachToType === 'team_member' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Team Member</label>
                      <Select value={newNoteAttachToId} onValueChange={setNewNoteAttachToId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNote}>
                  Create Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No sticky notes yet. Create your first note!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {notes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              customers={customers}
              teamMembers={teamMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
};