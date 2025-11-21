import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, Unlock, Clock, RotateCcw, Plus } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VersionManagementProps {
  projectId: string;
}

export function VersionManagement({ projectId }: VersionManagementProps) {
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ["selection-versions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selection_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createSnapshot = useMutation({
    mutationFn: async () => {
      // Fetch current selections and rooms
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("project_id", projectId);

      if (roomsError) throw roomsError;

      const { data: selections, error: selectionsError } = await supabase
        .from("selection_items")
        .select("*")
        .eq("project_id", projectId);

      if (selectionsError) throw selectionsError;

      const snapshot = {
        rooms,
        selections,
        timestamp: new Date().toISOString(),
      };

      const nextVersion = (versions?.[0]?.version_number || 0) + 1;

      const { error: insertError } = await supabase
        .from("selection_versions")
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          label: snapshotLabel || `Version ${nextVersion}`,
          snapshot_json: snapshot,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Snapshot created successfully");
      setSnapshotLabel("");
      queryClient.invalidateQueries({ queryKey: ["selection-versions", projectId] });
    },
    onError: (error) => {
      toast.error("Failed to create snapshot");
      console.error(error);
    },
  });

  const toggleLock = useMutation({
    mutationFn: async ({ versionId, locked }: { versionId: string; locked: boolean }) => {
      const { error } = await supabase
        .from("selection_versions")
        .update({ locked: !locked })
        .eq("id", versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Version lock status updated");
      queryClient.invalidateQueries({ queryKey: ["selection-versions", projectId] });
    },
    onError: () => {
      toast.error("Failed to update lock status");
    },
  });

  const restoreVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const version = versions?.find((v) => v.id === versionId);
      if (!version?.snapshot_json) throw new Error("Version not found");

      const snapshot = version.snapshot_json as any;

      // Delete current selections
      await supabase.from("selection_items").delete().eq("project_id", projectId);

      // Restore selections
      if (snapshot.selections?.length > 0) {
        const { error: selectionsError } = await supabase
          .from("selection_items")
          .insert(
            snapshot.selections.map((s: any) => ({
              ...s,
              id: undefined,
              created_at: undefined,
              updated_at: undefined,
            }))
          );

        if (selectionsError) throw selectionsError;
      }
    },
    onSuccess: () => {
      toast.success("Version restored successfully");
      setRestoreVersionId(null);
      queryClient.invalidateQueries({ queryKey: ["selection-items", projectId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", projectId] });
    },
    onError: (error) => {
      toast.error("Failed to restore version");
      console.error(error);
    },
  });

  if (isLoading) {
    return <div>Loading versions...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Version label (optional)"
            value={snapshotLabel}
            onChange={(e) => setSnapshotLabel(e.target.value)}
          />
          <Button
            onClick={() => createSnapshot.mutate()}
            disabled={createSnapshot.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Snapshot
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {versions?.map((version) => (
          <Card key={version.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{version.label}</span>
                    <Badge variant="outline">v{version.version_number}</Badge>
                    {version.locked && (
                      <Badge variant="secondary">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(version.created_at!), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleLock.mutate({
                      versionId: version.id,
                      locked: version.locked || false,
                    })
                  }
                  disabled={toggleLock.isPending}
                >
                  {version.locked ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRestoreVersionId(version.id)}
                  disabled={restoreVersion.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {!versions?.length && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No snapshots yet. Create your first snapshot to save the current state of selections.
            </p>
          </Card>
        )}
      </div>

      <AlertDialog open={!!restoreVersionId} onOpenChange={() => setRestoreVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all current selections with the selected version. This action cannot be undone.
              Consider creating a snapshot of the current state first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreVersionId && restoreVersion.mutate(restoreVersionId)}
            >
              Restore Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
