import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Mail, Calendar, BarChart3 } from "lucide-react";
import { supabaseService, TeamMember } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

const TeamManager = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [selectedMemberStats, setSelectedMemberStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roles: ["salesperson"] as string[],
    hire_date: "",
    is_active: true,
    username: "",
    password: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.username || (!formData.password && !editingMember)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert roles array to format that the service expects
      const memberData = {
        ...formData,
        role: formData.roles[0], // Keep backward compatibility with single role
        roles: formData.roles    // New multi-role support
      };

      if (editingMember) {
        await supabaseService.updateTeamMember(editingMember.id, memberData);
        toast({
          title: "Success",
          description: "Team member updated successfully.",
        });
        setIsEditDialogOpen(false);
        setEditingMember(null);
      } else {
        await supabaseService.addTeamMember(memberData);
        toast({
          title: "Success",
          description: "Team member added successfully.",
        });
        setIsAddDialogOpen(false);
      }
      
      resetForm();
      await loadTeamMembers();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast({
        title: "Error",
        description: "Failed to save team member.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      roles: (member as any).roles || [member.role], // Support both old and new format
      hire_date: member.hire_date || "",
      is_active: member.is_active,
      username: (member as any).username || "",
      password: ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (memberId: string) => {
    if (window.confirm("Are you sure you want to delete this team member?")) {
      try {
        await supabaseService.deleteTeamMember(memberId);
        toast({
          title: "Success",
          description: "Team member deleted successfully.",
        });
        await loadTeamMembers();
      } catch (error) {
        console.error('Error deleting team member:', error);
        toast({
          title: "Error",
          description: "Failed to delete team member.",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewStats = async (member: TeamMember) => {
    try {
      const stats = await supabaseService.getTeamMemberStats(member.id);
      setSelectedMemberStats({ member, stats });
      setIsStatsDialogOpen(true);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error",
        description: "Failed to load team member statistics.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      roles: ["salesperson"],
      hire_date: "",
      is_active: true,
      username: "",
      password: ""
    });
    setEditingMember(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Team Management
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
            </DialogHeader>
            <TeamMemberForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewStats(member)}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{member.email}</span>
                  </div>
                  {(member as any).username && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">Username:</span>
                      <span>{(member as any).username}</span>
                    </div>
                  )}
                  {member.hire_date && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Hired: {new Date(member.hire_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Badge variant={member.is_active ? "default" : "secondary"}>
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">Roles:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((member as any).roles || [member.role]).map((role: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No team members yet.</p>
            <p className="text-sm text-gray-500 mt-2">Add your first team member to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <TeamMemberForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMemberStats?.member.name} - Performance Stats
            </DialogTitle>
          </DialogHeader>
          {selectedMemberStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{selectedMemberStats.stats.leads.total}</div>
                    <div className="text-sm text-gray-600">Total Leads</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{selectedMemberStats.stats.leads.won}</div>
                    <div className="text-sm text-gray-600">Won Leads</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{selectedMemberStats.stats.leads.qualified}</div>
                    <div className="text-sm text-gray-600">Qualified Leads</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">${selectedMemberStats.stats.leads.totalValue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Lead Value</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Team Member Form Component with updated role options
const TeamMemberForm = ({ formData, setFormData, onSubmit, onCancel, isEdit = false }: {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEdit?: boolean;
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Name *</Label>
      <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        required
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="email">Email *</Label>
      <Input
        id="email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        required
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="username">Username *</Label>
      <Input
        id="username"
        value={formData.username}
        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
        required
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="password">Password *</Label>
      <Input
        id="password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        required={!isEdit}
        placeholder={isEdit ? "Leave blank to keep current password" : ""}
      />
    </div>

    <div className="space-y-2">
      <Label>Roles (Select up to 3) *</Label>
      <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
        {[
          { value: "salesperson", label: "Salesperson" },
          { value: "project_manager", label: "Project Manager" },
          { value: "estimator", label: "Estimator" },
          { value: "manager", label: "Manager" },
          { value: "admin", label: "Admin" },
          { value: "owner", label: "Owner" }
        ].map((role) => (
          <div key={role.value} className="flex items-center space-x-2">
            <Checkbox
              id={role.value}
              checked={formData.roles.includes(role.value)}
              disabled={!formData.roles.includes(role.value) && formData.roles.length >= 3}
              onCheckedChange={(checked) => {
                if (checked) {
                  if (formData.roles.length < 3) {
                    setFormData(prev => ({
                      ...prev,
                      roles: [...prev.roles, role.value]
                    }));
                  }
                } else {
                  setFormData(prev => ({
                    ...prev,
                    roles: prev.roles.filter(r => r !== role.value)
                  }));
                }
              }}
            />
            <Label htmlFor={role.value} className="text-sm font-normal">
              {role.label}
            </Label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Selected: {formData.roles.length}/3 roles
      </p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="hire_date">Hire Date</Label>
      <Input
        id="hire_date"
        type="date"
        value={formData.hire_date}
        onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="is_active">Status</Label>
      <Select 
        value={formData.is_active.toString()} 
        onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'true' }))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="flex justify-end space-x-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">
        {isEdit ? "Update Team Member" : "Add Team Member"}
      </Button>
    </div>
  </form>
);

export default TeamManager;
