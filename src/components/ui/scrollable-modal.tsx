import * as React from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ScrollableModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  maxHeight?: string
  className?: string
}

export function ScrollableModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxHeight = "80vh",
  className
}: ScrollableModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-4xl w-full p-0 overflow-hidden [&>button]:hidden",
          className
        )}
        style={{ maxHeight, height: 'fit-content' }}
      >
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          {(title || description) && (
            <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  {title && (
                    <DialogTitle className="text-xl font-semibold">
                      {title}
                    </DialogTitle>
                  )}
                  {description && (
                    <DialogDescription className="mt-1 text-muted-foreground">
                      {description}
                    </DialogDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-6 w-6 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
          )}
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}