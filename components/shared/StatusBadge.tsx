import React from "react";
import { Badge } from "@/components/ui/badge";
import { IssueStatus } from "@prisma/client";
import { CheckCircle2, Clock, AlertTriangle, BookCheck, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: IssueStatus | "AVAILABLE" | "OUT_OF_STOCK" | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "RETURNED":
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="h-3 w-3" />
          <span>Returned</span>
        </Badge>
      );
    case "OVERDUE":
      return (
        <Badge variant="destructive" className={className}>
          <AlertTriangle className="h-3 w-3" />
          <span>Overdue</span>
        </Badge>
      );
    case "ISSUED":
      return (
        <Badge variant="default" className={className}>
          <Clock className="h-3 w-3" />
          <span>Active Issue</span>
        </Badge>
      );
    case "AVAILABLE":
      return (
        <Badge variant="success" className={className}>
          <BookCheck className="h-3 w-3" />
          <span>Available</span>
        </Badge>
      );
    case "OUT_OF_STOCK":
      return (
        <Badge variant="secondary" className={className}>
          <XCircle className="h-3 w-3 text-stone-500" />
          <span>All Issued</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={className}>
          <span>{status}</span>
        </Badge>
      );
  }
}
