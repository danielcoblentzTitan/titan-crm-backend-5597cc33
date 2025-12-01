import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import DesignSelections from "@/components/DesignSelections";

const Index = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || 'demo-project';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-foreground">Design Selections</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto">
        <DesignSelections projectId={projectId} />
      </main>
    </div>
  );
};

export default Index;
