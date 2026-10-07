import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  heading: string;
  subheading?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  heading,
  subheading,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[hsl(var(--border))]",
        className
      )}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-title tracking-tight text-[hsl(var(--foreground))]">
          {heading}
        </h1>
        {subheading && (
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {subheading}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
