import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Edit } from "lucide-react";

interface EstimateLinkProps {
  estimateId: string;
  text: string;
  onEditEstimate: (estimateId: string) => void;
}

export const EstimateLink: React.FC<EstimateLinkProps> = ({ 
  estimateId, 
  text, 
  onEditEstimate 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onEditEstimate(estimateId);
  };

  return (
    <Button
      variant="link"
      className="p-0 h-auto text-left justify-start text-blue-600 hover:text-blue-800"
      onClick={handleClick}
    >
      <FileText className="w-4 h-4 mr-1" />
      {text}
      <Edit className="w-3 h-3 ml-1 opacity-60" />
    </Button>
  );
};

// Function to parse notes and render estimate links
export const parseNotesWithEstimateLinks = (
  notes: string, 
  onEditEstimate: (estimateId: string) => void
): React.ReactNode[] => {
  if (!notes) return [];

  const parts = notes.split(/(\[ESTIMATE:([^\]]+)\]([^[]+)\[\/ESTIMATE\])/g);
  const result: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Check if this is an estimate link
    const estimateMatch = part.match(/\[ESTIMATE:([^\]]+)\]([^[]+)\[\/ESTIMATE\]/);
    
    if (estimateMatch) {
      const estimateId = estimateMatch[1];
      const linkText = estimateMatch[2];
      
      result.push(
        <EstimateLink
          key={`estimate-${estimateId}-${i}`}
          estimateId={estimateId}
          text={linkText}
          onEditEstimate={onEditEstimate}
        />
      );
    } else if (part && !part.match(/\[ESTIMATE:([^\]]+)\]/)) {
      // Regular text, split by line breaks
      const lines = part.split('\n');
      lines.forEach((line, lineIndex) => {
        if (line.trim()) {
          result.push(
            <span key={`text-${i}-${lineIndex}`}>
              {line}
            </span>
          );
        }
        if (lineIndex < lines.length - 1) {
          result.push(<br key={`br-${i}-${lineIndex}`} />);
        }
      });
    }
  }

  return result;
};