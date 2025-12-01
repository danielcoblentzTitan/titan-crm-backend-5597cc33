import React from "react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/services/supabaseService";

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onPhaseUpdate: (projectId: string, newPhase: string) => void;
  onUpdate: () => void;
}

export const ProjectList = ({
  projects,
  onEdit,
  onDelete,
  onPhaseUpdate,
  onUpdate
}: ProjectListProps) => {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
          onPhaseUpdate={onPhaseUpdate}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};