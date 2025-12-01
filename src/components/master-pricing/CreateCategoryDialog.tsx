import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Folder } from "lucide-react";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCategory: { name: string; description: string };
  onCategoryChange: (category: { name: string; description: string }) => void;
  onCreateCategory: () => void;
}

export const CreateCategoryDialog = ({
  open,
  onOpenChange,
  newCategory,
  onCategoryChange,
  onCreateCategory
}: CreateCategoryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Folder className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              value={newCategory.name}
              onChange={(e) => onCategoryChange({ ...newCategory, name: e.target.value })}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <Label htmlFor="category-description">Description</Label>
            <Input
              id="category-description"
              value={newCategory.description}
              onChange={(e) => onCategoryChange({ ...newCategory, description: e.target.value })}
              placeholder="Enter description (optional)"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onCreateCategory} disabled={!newCategory.name}>
              Create Category
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};