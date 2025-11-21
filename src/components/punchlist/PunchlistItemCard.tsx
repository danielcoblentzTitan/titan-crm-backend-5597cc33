import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle2, Clock, AlertTriangle, Calendar, User, MapPin, Camera, Trash2, MessageSquare, Images } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { usePunchlist, PunchlistItem, Photo } from '@/hooks/usePunchlist';
import { CommentsThread } from './CommentsThread';
import { EnhancedPhotoManager } from './EnhancedPhotoManager';
import { cn } from '@/lib/utils';

interface PunchlistItemCardProps {
  item: PunchlistItem;
  isCustomerView?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

export function PunchlistItemCard({ 
  item, 
  isCustomerView = false, 
  isSelected = false,
  onSelectionChange,
  showCheckbox = false
}: PunchlistItemCardProps) {
  const { updateItem, markComplete, deleteItem, updatePhotos } = usePunchlist(item.project_id);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      if (newStatus === 'Completed') {
        await markComplete(item.id);
      } else {
        await updateItem(item.id, { status: newStatus as 'Open' | 'In Progress' | 'Completed' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this punchlist item?')) {
      try {
        await deleteItem(item.id);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const isOverdue = () => {
    if (!item.due_date || item.status === 'Completed') return false;
    const today = new Date();
    const dueDate = new Date(item.due_date);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getDaysOverdue = () => {
    if (!item.due_date) return 0;
    const today = new Date();
    const dueDate = new Date(item.due_date);
    return Math.abs(differenceInDays(today, dueDate));
  };

  const isDueSoon = () => {
    if (!item.due_date || item.status === 'Completed') return false;
    const today = new Date();
    const dueDate = new Date(item.due_date);
    const diffDays = differenceInDays(dueDate, today);
    return diffDays >= 0 && diffDays <= 3;
  };

  const handlePhotosUpdate = async (photos: Photo[], photoType: 'general' | 'before' | 'after') => {
    await updatePhotos(item.id, photos, photoType);
  };

  const totalPhotos = (item.photos?.length || 0) + (item.before_photos?.length || 0) + (item.after_photos?.length || 0);
  const hasComments = item.last_comment_at !== null;

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        item.status === 'Completed' && "opacity-75",
        isOverdue() && "border-red-200 bg-red-50/50",
        isDueSoon() && !isOverdue() && "border-yellow-200 bg-yellow-50/50",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              {showCheckbox && (
                <div className="flex items-center mr-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectionChange?.(item.id, checked as boolean)}
                  />
                </div>
              )}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("border", getStatusColor(item.status))}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1">{item.status}</span>
                  </Badge>
                  <Badge variant="outline" className={cn("border", getPriorityColor(item.priority))}>
                    {item.priority}
                  </Badge>
                  {item.source === 'customer' && (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                      Customer Request
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{item.location}</span>
                </div>
              </div>

              {!isCustomerView && (
                <div className="flex items-center gap-2">
                  <Select
                    value={item.status}
                    onValueChange={handleStatusUpdate}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              {item.assigned_to_vendor && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Assigned to: {item.assigned_to_vendor}</span>
                </div>
              )}
              
              {item.due_date && (
                <div className={cn(
                  "flex items-center gap-2",
                  isOverdue() && "text-red-600 font-medium",
                  isDueSoon() && !isOverdue() && "text-yellow-600 font-medium"
                )}>
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                    {isOverdue() && (
                      <Badge variant="destructive" className="ml-2">
                        {getDaysOverdue()} days overdue
                      </Badge>
                    )}
                    {isDueSoon() && !isOverdue() && (
                      <Badge variant="outline" className="ml-2 border-yellow-300 text-yellow-800">
                        Due soon
                      </Badge>
                    )}
                  </span>
                </div>
              )}
              
              <div className="text-xs">
                Created: {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
              </div>
              
              {item.completed_at && (
                <div className="text-xs text-green-600">
                  Completed: {format(new Date(item.completed_at), 'MMM d, yyyy h:mm a')}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className={showComments ? "bg-primary/10" : ""}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments
                {hasComments && <Badge variant="secondary" className="ml-2">!</Badge>}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhotos(!showPhotos)}
                className={showPhotos ? "bg-primary/10" : ""}
              >
                <Images className="h-4 w-4 mr-2" />
                Photos
                {totalPhotos > 0 && <Badge variant="secondary" className="ml-2">{totalPhotos}</Badge>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4">
          <CommentsThread itemId={item.id} isCustomerView={isCustomerView} />
        </div>
      )}

      {/* Photos Section */}
      {showPhotos && (
        <div className="mt-4">
          <EnhancedPhotoManager
            itemId={item.id}
            photos={item.photos || []}
            beforePhotos={item.before_photos || []}
            afterPhotos={item.after_photos || []}
            onPhotosUpdate={handlePhotosUpdate}
            isCustomerView={isCustomerView}
          />
        </div>
      )}
    </>
  );
}