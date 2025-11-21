import React from "react";

interface LazyTabContentProps {
  component: string;
}

export function LazyTabContent({ component }: LazyTabContentProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-muted-foreground">Feature coming soon</p>
    </div>
  );
}
