"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  BookmarkPlus,
  BookCheck,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BookOpen,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency, getDaysRemainingOrOverdue, calculateFine } from "@/lib/utils";
import { MAX_ACTIVE_ISSUES_PER_STUDENT } from "@/lib/constants";
import { IssueItem } from "@/types";
import { toast } from "sonner";

interface StudentDetailData {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: number;
  createdAt: string;
  activeIssues: IssueItem[];
  returnedIssues: IssueItem[];
  activeCount: number;
  totalHistoryCount: number;
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();

  const [student, setStudent] = useState<StudentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [returningIssueId, setReturningIssueId] = useState<string | null>(null);

  const fetchStudent = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/students/${id}`);
      const json = await res.json();
      if (json.success) {
        setStudent(json.data);
      } else {
        toast.error(json.error || "Student not found");
      }
    } catch (err) {
      console.error("Fetch student detail error:", err);
      toast.error("Network error fetching student profile");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleReturnBook = async (issueId: string) => {
    try {
      setReturningIssueId(issueId);
      const res = await fetch(`/api/issues/${issueId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnDate: new Date().toISOString() }),
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to mark book as returned");
        return;
      }

      toast.success(json.message || "Book marked as returned!");
      fetchStudent();
    } catch (err) {
      console.error("Return error:", err);
      toast.error("Network error returning book");
    } finally {
      setReturningIssueId(null);
    }
  };

  if (isLoading || !student) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const activeCount = student.activeIssues.length;
  const canIssueMore = activeCount < MAX_ACTIVE_ISSUES_PER_STUDENT;

  return (
    <div className="space-y-8 pb-12">
      {/* Back button */}
      <div>
        <Link href="/students">
          <Button variant="ghost" size="sm" className="gap-2 text-[hsl(var(--muted-foreground))]">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Students Directory</span>
          </Button>
        </Link>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-[#131b38] border-[hsl(var(--border))]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-white font-serif-title text-2xl font-bold shadow-lg">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-title text-[hsl(var(--foreground))]">
                  {student.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 font-semibold text-[hsl(var(--foreground))]">
                  {student.studentId}
                </span>
              </div>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {student.department} &middot; Year {student.year}
              </p>

              <div className="mt-3 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  <span>{student.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  <span>{student.phone}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  <span>Registered: {formatDate(student.createdAt)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action & Allowance */}
          <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Borrowing Limit:</span>
              <span
                className={`font-semibold text-xs px-2.5 py-1 rounded-full ${
                  canIssueMore
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {activeCount} / {MAX_ACTIVE_ISSUES_PER_STUDENT} Active Books
              </span>
            </div>

            {canIssueMore ? (
              <Link href={`/issue?studentId=${student.studentId}`}>
                <Button className="bg-[#1e2a5a] hover:bg-[#162045] text-white gap-2 shadow-xs">
                  <BookmarkPlus className="h-4 w-4" />
                  <span>Issue New Book</span>
                </Button>
              </Link>
            ) : (
              <Button disabled variant="secondary" className="gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span>Limit Reached (Max 3)</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Active Borrowings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif-title text-[hsl(var(--foreground))] flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            <span>Currently Issued Books ({student.activeIssues.length})</span>
          </h2>
        </div>

        {student.activeIssues.length === 0 ? (
          <EmptyState
            icon={BookCheck}
            title="No active borrowings"
            description="This student currently has zero books checked out from the library."
            actionLabel={canIssueMore ? "Issue a Book" : undefined}
            onAction={
              canIssueMore
                ? () => router.push(`/issue?studentId=${student.studentId}`)
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {student.activeIssues.map((issue) => {
              const overdueInfo = getDaysRemainingOrOverdue(issue.dueDate);
              const dynamicFine = calculateFine(issue.dueDate, null);

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
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-14 w-10 rounded-md bg-stone-200 dark:bg-stone-800 shrink-0 overflow-hidden shadow-xs border border-[hsl(var(--border))]">
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
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1">
                            by {issue.book.author}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Book Metadata details */}
                    <div className="space-y-1.5 py-3 border-y border-[hsl(var(--border))] text-xs">
                      <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
                        <span>Shelf:</span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {issue.book.shelfLocation || "General"}
                        </span>
                      </div>
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

                    {/* Due / Overdue Status Banner */}
                    <div className="mt-3">
                      {overdueInfo.isOverdue ? (
                        <div className="flex items-center justify-between rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{overdueInfo.label}</span>
                          </div>
                          <span>Fine: {formatCurrency(dynamicFine)}</span>
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

                  {/* Return action button */}
                  <div className="mt-4 pt-3">
                    <Button
                      onClick={() => handleReturnBook(issue.id)}
                      isLoading={returningIssueId === issue.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
                      size="sm"
                    >
                      <BookCheck className="h-4 w-4" />
                      <span>Mark as Returned</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Issue History Table */}
      <div className="space-y-4 pt-6">
        <h2 className="text-xl font-bold font-serif-title text-[hsl(var(--foreground))] flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span>Past Borrowing History ({student.returnedIssues.length})</span>
        </h2>

        <Card className="overflow-hidden border-[hsl(var(--border))]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100/60 dark:bg-stone-800/60 text-xs uppercase font-semibold text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Issued On</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Returned On</th>
                  <th className="py-3 px-4">Fine Paid</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {student.returnedIssues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                      No returned records in history yet.
                    </td>
                  </tr>
                ) : (
                  student.returnedIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-xs sm:text-sm text-[hsl(var(--foreground))]">
                          {issue.book.title}
                        </p>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                          ISBN: {issue.book.isbn}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">{formatDate(issue.issueDate)}</td>
                      <td className="py-3.5 px-4 text-xs">{formatDate(issue.dueDate)}</td>
                      <td className="py-3.5 px-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatDate(issue.returnDate)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        {issue.fine > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(issue.fine)}
                          </span>
                        ) : (
                          <span className="text-stone-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status="RETURNED" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
