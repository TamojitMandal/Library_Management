"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookmarkCheck,
  Search,
  BookOpen,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Coins,
  RefreshCw,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate, formatCurrency, calculateFine, getDaysRemainingOrOverdue } from "@/lib/utils";
import { IssueItem } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ReturnBookPage() {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for returning
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [returnDate, setReturnDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isReturning, setIsReturning] = useState(false);

  const fetchActiveIssues = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch both ISSUED and OVERDUE records
      const params = new URLSearchParams({
        search: searchQuery,
        pageSize: "50",
      });

      const res = await fetch(`/api/issues?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        // Filter client-side to ensure only active (non-returned) issues are displayed
        const activeOnly = json.data.items.filter(
          (issue: IssueItem) => issue.status === "ISSUED" || issue.status === "OVERDUE"
        );
        setIssues(activeOnly);
      } else {
        toast.error(json.error || "Failed to fetch active issues");
      }
    } catch (err) {
      console.error("Fetch issues error:", err);
      toast.error("Network error fetching active borrowings");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchActiveIssues();
  }, [fetchActiveIssues]);

  const handleOpenReturnModal = (issue: IssueItem) => {
    setSelectedIssue(issue);
    setReturnDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleConfirmReturn = async () => {
    if (!selectedIssue) return;

    try {
      setIsReturning(true);
      const res = await fetch(`/api/issues/${selectedIssue.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnDate }),
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to mark book as returned");
        return;
      }

      toast.success(json.message || "Book successfully returned to inventory!");
      setSelectedIssue(null);
      fetchActiveIssues();
    } catch (err) {
      console.error("Confirm return error:", err);
      toast.error("Network error completing return");
    } finally {
      setIsReturning(false);
    }
  };

  // Live fine computation for modal
  const modalCalculatedFine = selectedIssue
    ? calculateFine(selectedIssue.dueDate, returnDate)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        heading="Book Return & Fine Processing"
        subheading="Search active borrowings by Student ID or Book Title, inspect due dates, and record returns."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActiveIssues}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        }
      />

      {/* Search Filter Bar */}
      <Card className="p-4 bg-[hsl(var(--card))]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Search by student name, Student ID (e.g. STU2025001), book title, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </Card>

      {/* Active Borrowings Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Active Borrowings Waiting for Return ({issues.length})
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <EmptyState
            icon={BookmarkCheck}
            title="No active borrowings found"
            description="There are currently no active loans matching your search filter."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => {
              const overdueInfo = getDaysRemainingOrOverdue(issue.dueDate);
              const fineAmount = calculateFine(issue.dueDate, null);

              return (
                <Card
                  key={issue.id}
                  className={`p-5 flex flex-col justify-between transition-all ${
                    overdueInfo.isOverdue
                      ? "border-rose-500/30 bg-rose-500/[0.02]"
                      : "border-[hsl(var(--border))]"
                  }`}
                >
                  <div>
                    {/* Header: Book cover and title */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className="h-14 w-10 rounded-lg bg-stone-200 dark:bg-stone-800 shrink-0 overflow-hidden shadow-xs border border-[hsl(var(--border))]">
                        {issue.book.coverUrl ? (
                          <img
                            src={issue.book.coverUrl}
                            alt={issue.book.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-4 w-4 m-auto mt-4 text-stone-400" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-sm text-[hsl(var(--foreground))] line-clamp-2">
                          {issue.book.title}
                        </h4>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                          {issue.book.author}
                        </p>
                        <p className="text-[11px] font-mono text-stone-500">
                          ISBN: {issue.book.isbn}
                        </p>
                      </div>
                    </div>

                    {/* Student Info Box */}
                    <div className="p-2.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/70 mb-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[hsl(var(--foreground))]">
                          {issue.student.name}
                        </span>
                        <span className="font-mono font-bold text-[11px] text-indigo-600 dark:text-indigo-400">
                          {issue.student.studentId}
                        </span>
                      </div>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        {issue.student.department} &middot; Year {issue.student.year}
                      </p>
                    </div>

                    {/* Dates */}
                    <div className="space-y-1 py-2 text-xs border-y border-[hsl(var(--border))]">
                      <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
                        <span>Issued On:</span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {formatDate(issue.issueDate)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
                        <span>Due Date:</span>
                        <span className="font-semibold text-[hsl(var(--foreground))]">
                          {formatDate(issue.dueDate)}
                        </span>
                      </div>
                    </div>

                    {/* Overdue Banner */}
                    <div className="mt-3">
                      {overdueInfo.isOverdue ? (
                        <div className="flex items-center justify-between rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{overdueInfo.label}</span>
                          </div>
                          <span>Fine: {formatCurrency(fineAmount)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{overdueInfo.label}</span>
                          </div>
                          <span>No Fine</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Return Button */}
                  <div className="mt-4 pt-2">
                    <Button
                      onClick={() => handleOpenReturnModal(issue)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
                      size="sm"
                    >
                      <BookmarkCheck className="h-4 w-4" />
                      <span>Process Return</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Modal with Live Fine Calculation */}
      <Dialog
        open={!!selectedIssue}
        onOpenChange={(open) => !open && setSelectedIssue(null)}
      >
        <DialogContent
          onClose={() => setSelectedIssue(null)}
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Confirm Book Return</DialogTitle>
            <DialogDescription>
              Record the book return to restore inventory copy and compute any overdue fines.
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              {/* Book & Student Summary */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-[hsl(var(--border))] text-xs space-y-1.5">
                <p className="font-semibold text-sm text-[hsl(var(--foreground))]">
                  {selectedIssue.book.title}
                </p>
                <p className="text-[hsl(var(--muted-foreground))]">
                  Borrower: <span className="font-semibold text-[hsl(var(--foreground))]">{selectedIssue.student.name}</span> ({selectedIssue.student.studentId})
                </p>
                <p className="text-[hsl(var(--muted-foreground))]">
                  Original Due Date: <span className="font-semibold text-[hsl(var(--foreground))]">{formatDate(selectedIssue.dueDate)}</span>
                </p>
              </div>

              {/* Return Date Picker */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Actual Return Date
                </label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>

              {/* Dynamic Live Fine Box */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  modalCalculatedFine > 0
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="h-5 w-5" />
                  <div>
                    <p className="text-xs font-bold">
                      {modalCalculatedFine > 0 ? "Late Fee Due" : "No Fine Incurred"}
                    </p>
                    <p className="text-[11px] opacity-80">
                      {modalCalculatedFine > 0
                        ? "Calculated at ₹5 per overdue day"
                        : "Returned on or before due date"}
                    </p>
                  </div>
                </div>

                <span className="text-lg font-bold font-serif-title">
                  {formatCurrency(modalCalculatedFine)}
                </span>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedIssue(null)}
                  disabled={isReturning}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmReturn}
                  isLoading={isReturning}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirm & Mark Returned
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
