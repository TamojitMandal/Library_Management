"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BookCheck,
  Clock,
  AlertTriangle,
  Users,
  Coins,
  ArrowUpRight,
  BookmarkPlus,
  BookmarkCheck,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  Library,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency, getDaysRemainingOrOverdue } from "@/lib/utils";
import { DashboardStats } from "@/types";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CATEGORY_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#64748B", // Slate
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysTimeframe, setDaysTimeframe] = useState<7 | 30>(7);

  const fetchStats = async (days = daysTimeframe) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/dashboard/stats?days=${days}`);
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        toast.error(json.error || "Failed to load dashboard metrics");
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Network error fetching dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(daysTimeframe);
  }, [daysTimeframe]);

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <PageHeader
        heading="Circulation Overview"
        subheading="Real-time catalog inventory, student borrowings, and overdue alerts."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStats(daysTimeframe)}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            <Link href="/issue">
              <Button size="sm" className="bg-[#1e2a5a] hover:bg-[#162045] text-white gap-2 shadow-xs">
                <BookmarkPlus className="h-4 w-4" />
                <span>Issue Book</span>
              </Button>
            </Link>

            <Link href="/return">
              <Button size="sm" variant="secondary" className="gap-2">
                <BookmarkCheck className="h-4 w-4 text-emerald-600" />
                <span>Return Book</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading || !stats ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Titles"
              value={stats.totalBooks}
              subtitle={`${stats.totalCopies ?? 0} total physical copies`}
              icon={BookOpen}
              variant="indigo"
            />
            <StatCard
              title="Available Copies"
              value={stats.availableCopies}
              subtitle="Ready on shelves"
              icon={BookCheck}
              variant="emerald"
            />
            <StatCard
              title="Currently Issued"
              value={stats.currentlyIssued}
              subtitle="Active borrowings"
              icon={Clock}
              variant="primary"
            />
            <StatCard
              title="Overdue Books"
              value={stats.overdueCount}
              subtitle={stats.overdueCount > 0 ? "Action required" : "All on schedule"}
              icon={AlertTriangle}
              variant={stats.overdueCount > 0 ? "rose" : "emerald"}
            />
            <StatCard
              title="Active Students"
              value={stats.totalStudents}
              subtitle="Registered borrowers"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Fines Collected"
              value={formatCurrency(stats.totalFinesCollected)}
              subtitle={`₹${stats.pendingFines} pending`}
              icon={Coins}
              variant="amber"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circulation Activity Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                <span>Circulation Trend</span>
              </CardTitle>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Comparison of books issued vs books returned
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center rounded-xl bg-stone-100 dark:bg-stone-800 p-1 text-xs">
              <button
                onClick={() => setDaysTimeframe(7)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  daysTimeframe === 7
                    ? "bg-white dark:bg-stone-900 text-[hsl(var(--foreground))] shadow-xs"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDaysTimeframe(30)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  daysTimeframe === 30
                    ? "bg-white dark:bg-stone-900 text-[hsl(var(--foreground))] shadow-xs"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {isLoading || !stats ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.issuesTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="issuesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="returnsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.75rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="issues"
                    name="Books Issued"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#issuesGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="returns"
                    name="Books Returned"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#returnsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Books by Category Donut Chart */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5 text-amber-500" />
              <span>Catalog by Category</span>
            </CardTitle>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Distribution of titles across departments
            </p>
          </div>

          <div className="h-[220px] w-full my-auto">
            {isLoading || !stats ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="category"
                  >
                    {stats.categoryDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [`${value} titles`, `${name}`]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top categories breakdown */}
          <div className="space-y-1.5 pt-4 border-t border-[hsl(var(--border))]">
            {stats?.categoryDistribution.slice(0, 3).map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-[hsl(var(--foreground))]">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="truncate">{cat.category}</span>
                </span>
                <span className="font-semibold text-[hsl(var(--muted-foreground))] shrink-0">
                  {cat.count} titles ({cat.copies} copies)
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Overdue Alerts & Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Alerts Box */}
        <Card className="p-6 border-rose-500/20 bg-rose-500/[0.02]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold font-serif-title text-base text-[hsl(var(--foreground))]">
                  Overdue Borrowings
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Students with past-due books and accumulated fines
                </p>
              </div>
            </div>
            <Link href="/records?status=OVERDUE">
              <Button variant="ghost" size="sm" className="text-xs text-rose-600 dark:text-rose-400 gap-1">
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading || !stats ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            ) : stats.overdueAlerts.length === 0 ? (
              <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No overdue books found. All returns are currently on schedule!
              </div>
            ) : (
              stats.overdueAlerts.slice(0, 4).map((issue) => {
                const overdueInfo = getDaysRemainingOrOverdue(issue.dueDate);
                return (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-rose-500/15 bg-white/70 dark:bg-stone-900/60 transition-all hover:border-rose-500/30"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-600 font-bold text-xs font-serif-title">
                        {overdueInfo.days}d
                      </div>
                      <div className="truncate">
                        <p className="truncate text-xs sm:text-sm font-semibold text-[hsl(var(--foreground))]">
                          {issue.book.title}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {issue.student.name} &middot;{" "}
                          <span className="font-mono text-[11px]">
                            {issue.student.studentId}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className="inline-block text-xs font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(issue.fine)}
                      </span>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        Fine Accrued
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Recently Issued Books Box */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] dark:text-indigo-300">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold font-serif-title text-base text-[hsl(var(--foreground))]">
                  Recent Circulation Activity
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Latest checkout transactions recorded
                </p>
              </div>
            </div>
            <Link href="/records">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading || !stats ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            ) : stats.recentIssues.length === 0 ? (
              <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No recent circulation activities recorded.
              </div>
            ) : (
              stats.recentIssues.slice(0, 4).map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[hsl(var(--border))] bg-stone-50/50 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-8 rounded-md bg-stone-200 dark:bg-stone-800 shrink-0 overflow-hidden relative shadow-xs">
                      {issue.book.coverUrl ? (
                        <img
                          src={issue.book.coverUrl}
                          alt={issue.book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-4 w-4 m-auto mt-3 text-stone-400" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="truncate text-xs sm:text-sm font-semibold text-[hsl(var(--foreground))]">
                        {issue.book.title}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Issued to {issue.student.name} &middot; {formatDate(issue.issueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-3">
                    <StatusBadge status={issue.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
