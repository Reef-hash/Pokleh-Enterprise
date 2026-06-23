/**
 * Reusable mobile-first page header.
 *
 * - On mobile: title + subtitle stack, action button becomes icon-only
 * - On desktop: horizontal layout, full button text
 *
 * Usage:
 *   <PageHeader
 *     title="Stock Intake"
 *     subtitle="Record incoming stock from suppliers"
 *     actionLabel="Record Intake"
 *     actionIcon={Plus}
 *     onAction={openDialog}
 *   />
 */

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Text shown in the desktop button (hidden on mobile). */
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  /** Render a custom element instead of a Button. */
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
        )}
      </div>

      {children ? (
        <div className="shrink-0">{children}</div>
      ) : ActionIcon && onAction ? (
        <Button
          onClick={onAction}
          size="default"
          className="shrink-0 self-start sm:self-auto"
        >
          <ActionIcon className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{actionLabel}</span>
        </Button>
      ) : null}
    </div>
  );
}
