import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, startOfDay } from "date-fns";
import { FINE_PER_DAY_INR } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return format(d, "MMM dd, yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return format(d, "MMM dd, yyyy · hh:mm a");
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function calculateFine(dueDate: Date | string, returnDate?: Date | string | null): number {
  const due = startOfDay(new Date(dueDate));
  const returnedOrNow = returnDate ? startOfDay(new Date(returnDate)) : startOfDay(new Date());

  if (returnedOrNow <= due) {
    return 0;
  }

  const daysLate = differenceInDays(returnedOrNow, due);
  return Math.max(0, daysLate * FINE_PER_DAY_INR);
}

export function getDaysRemainingOrOverdue(dueDate: Date | string): {
  isOverdue: boolean;
  days: number;
  label: string;
} {
  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(new Date());

  const diff = differenceInDays(due, today);

  if (diff < 0) {
    const overdueDays = Math.abs(diff);
    return {
      isOverdue: true,
      days: overdueDays,
      label: `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`,
    };
  } else if (diff === 0) {
    return {
      isOverdue: false,
      days: 0,
      label: "Due today",
    };
  } else {
    return {
      isOverdue: false,
      days: diff,
      label: `Due in ${diff} ${diff === 1 ? "day" : "days"}`,
    };
  }
}
