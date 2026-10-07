"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Search,
  Download,
  Filter,
  RefreshCw,
  Calendar,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { IssueItem, PaginatedResult } from "@/types";
import { toast } from "sonner";

function RecordsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [records, setRecords] = useState<IssueItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        search: searchQuery,
        status: selectedStatus,
        from: fromDate,
        to: toDate,
      });

      const res = await fetch(`/api/issues?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const result: PaginatedResult<IssueItem> = json.data;
        setRecords(result.items);
        setTotalItems(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(json.error || "Failed to fetch circulation records");
      }
    } catch (err) {
      console.error("Fetch records error:", err);
      toast.error("Network error fetching circulation records");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedStatus, fromDate, toDate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams({
        search: searchQuery,
        status: selectedStatus,
        from: fromDate,
        to: toDate,
      });

      const res = await fetch(`/api/records/export?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to export CSV");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `library-circulation-records-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("CSV file downloaded successfully!");
    } catch (err) {
      console.error("Export CSV error:", err);
      toast.error("Failed to export records to CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        heading="Circulation Records & History"
        subheading="Comprehensive archive of all book checkouts, returns, overdue periods, and fine receipts."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecords}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            <Button
              onClick={handleExportCsv}
              size="sm"
              variant="secondary"
              isLoading={isExporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-[hsl(var(--card))]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Search by student name, ID, book title, or ISBN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-white/70 dark:bg-stone-900/60 px-3 text-xs sm:text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ISSUED">Active Issues Only</option>
              <option value="RETURNED">Returned Only</option>
              <option value="OVERDUE">Overdue Only</option>
            </select>
          </div>

          {/* Date from / to */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              placeholder="From date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs"
              title="Filter from issue date"
            />
            <span className="text-xs text-stone-400">to</span>
            <Input
              type="date"
              placeholder="To date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs"
              title="Filter to issue date"
            />
          </div>
        </div>
      </Card>

      {/* Circulation Table */}
      <Card className="overflow-hidden border-[hsl(var(--border))]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100/60 dark:bg-stone-800/60 text-xs uppercase font-semibold text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
              <tr>
                <th className="py-3.5 px-4">Book Title & ISBN</th>
                <th className="py-3.5 px-4">Student Borrower</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Return Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={FileText}
                      title="No circulation records found"
                      description="No records match the active search and filter constraints."
                    />
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    {/* Book */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3 max-w-xs">
                        <div className="h-10 w-7 rounded bg-stone-200 dark:bg-stone-800 shrink-0 overflow-hidden shadow-xs">
                          {record.book.coverUrl ? (
                            <img
                              src={record.book.coverUrl}
                              alt={record.book.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-3 w-3 m-auto mt-3 text-stone-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-xs sm:text-sm text-[hsl(var(--foreground))] truncate">
                            {record.book.title}
                          </p>
                          <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
                            {record.book.isbn}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Student */}
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-xs sm:text-sm text-[hsl(var(--foreground))]">
                          {record.student.name}
                        </p>
                        <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                          {record.student.studentId}
                        </p>
                      </div>
                    </td>

                    {/* Issue Date */}
                    <td className="py-4 px-4 text-xs">
                      {formatDate(record.issueDate)}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-4 text-xs font-medium">
                      {formatDate(record.dueDate)}
                    </td>

                    {/* Return Date */}
                    <td className="py-4 px-4 text-xs">
                      {record.returnDate ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatDate(record.returnDate)}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">Active</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <StatusBadge status={record.status} />
                    </td>

                    {/* Fine */}
                    <td className="py-4 px-4 text-right">
                      {record.fine > 0 ? (
                        <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                          {formatCurrency(record.fine)}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">₹0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </Card>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse bg-stone-100 dark:bg-stone-900 rounded-2xl" />}>
      <RecordsContent />
    </Suspense>
  );
}
