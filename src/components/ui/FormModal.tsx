import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: () => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  className?: string;
}

export const FormModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  submitDisabled = false,
  className,
}: FormModalProps) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    await onSubmit?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col max-h-[90dvh] sm:max-h-[85dvh] w-[95vw] sm:w-full sm:max-w-md md:max-w-lg p-0 gap-0",
          className
        )}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b bg-background px-6 py-4 pr-12">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-xs sm:text-sm">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 py-4">
          {children}
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t bg-background px-6 py-3 flex flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          {onSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={submitDisabled || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
