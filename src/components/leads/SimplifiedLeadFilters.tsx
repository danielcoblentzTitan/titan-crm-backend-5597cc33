import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SimplifiedLeadFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearFilters: () => void;
}

export const SimplifiedLeadFilters = ({
  searchTerm,
  setSearchTerm,
  clearFilters
}: SimplifiedLeadFiltersProps) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads by name, company, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 px-3"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};