import React from 'react';
import { useParams } from 'react-router-dom';
import { PunchlistPrintView } from '@/components/punchlist/PunchlistPrintView';
import { usePunchlist } from '@/hooks/usePunchlist';
import { useEffect, useState } from 'react';
import { supabaseService, type Project } from '@/services/supabaseService';

const PunchlistPrint = () => {
  const { id } = useParams();
  const { items, loading } = usePunchlist(id);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      try {
        const projects = await supabaseService.getProjects();
        const foundProject = projects.find(p => p.id === id);
        setProject(foundProject || null);
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    loadProject();
  }, [id]);

  useEffect(() => {
    // Auto-print when component mounts and data is loaded
    if (!loading && items.length > 0) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [loading, items]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading punchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <PunchlistPrintView 
      items={items} 
      projectName={project?.name}
    />
  );
};

export default PunchlistPrint;