import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateFine } from "@/lib/utils";
import { IssueStatus } from "@prisma/client";
import { subDays, format, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const timelineDays = daysParam === 30 ? 30 : 7;

    const now = new Date();

    // 1. Core Counts
    const [
      totalBooks,
      booksAggregate,
      totalStudents,
      activeIssuesCount,
      allOverdueIssues,
      totalFines,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.book.aggregate({
        _sum: {
          totalCopies: true,
          availableCopies: true,
        },
      }),
      prisma.student.count(),
      prisma.issue.count({
        where: {
          status: { in: [IssueStatus.ISSUED, IssueStatus.OVERDUE] },
        },
      }),
      prisma.issue.findMany({
        where: {
          returnDate: null,
          dueDate: { lt: now },
        },
        include: {
          book: true,
          student: true,
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.issue.aggregate({
        _sum: {
          fine: true,
        },
      }),
    ]);

    const totalCopies = booksAggregate._sum.totalCopies || 0;
    const availableCopies = booksAggregate._sum.availableCopies || 0;
    const overdueCount = allOverdueIssues.length;

    // Calculate pending fines from overdue records
    let pendingFines = 0;
    const overdueAlerts = allOverdueIssues.slice(0, 10).map((issue) => {
      const fine = calculateFine(issue.dueDate, null);
      pendingFines += fine;
      return {
        ...issue,
        status: IssueStatus.OVERDUE,
        fine,
      };
    });

    // 2. Category distribution
    const categoryGroups = await prisma.book.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      _sum: {
        totalCopies: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    const categoryDistribution = categoryGroups.map((group) => ({
      category: group.category,
      count: group._count.id,
      copies: group._sum.totalCopies || 0,
    }));

    // 3. Issues Timeline (Last 7 or 30 days)
    const startDate = startOfDay(subDays(now, timelineDays - 1));

    const [recentIssuesList, timelineIssues, timelineReturns] = await Promise.all([
      // Recent issues
      prisma.issue.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          book: {
            select: { id: true, title: true, author: true, isbn: true, coverUrl: true },
          },
          student: {
            select: { id: true, studentId: true, name: true, department: true },
          },
        },
      }),
      // Timeline issues
      prisma.issue.findMany({
        where: {
          issueDate: { gte: startDate },
        },
        select: { issueDate: true },
      }),
      // Timeline returns
      prisma.issue.findMany({
        where: {
          returnDate: { gte: startDate },
        },
        select: { returnDate: true },
      }),
    ]);

    // Build timeline day by day
    const timelineMap: Record<string, { date: string; issues: number; returns: number }> = {};
    for (let i = 0; i < timelineDays; i++) {
      const day = subDays(now, timelineDays - 1 - i);
      const dateKey = format(day, "yyyy-MM-dd");
      const displayKey = format(day, "MMM dd");
      timelineMap[dateKey] = {
        date: displayKey,
        issues: 0,
        returns: 0,
      };
    }

    timelineIssues.forEach((item) => {
      const key = format(new Date(item.issueDate), "yyyy-MM-dd");
      if (timelineMap[key]) {
        timelineMap[key].issues += 1;
      }
    });

    timelineReturns.forEach((item) => {
      if (item.returnDate) {
        const key = format(new Date(item.returnDate), "yyyy-MM-dd");
        if (timelineMap[key]) {
          timelineMap[key].returns += 1;
        }
      }
    });

    const issuesTimeline = Object.values(timelineMap);

    return NextResponse.json({
      success: true,
      data: {
        totalBooks,
        totalCopies,
        availableCopies,
        currentlyIssued: activeIssuesCount,
        overdueCount,
        totalStudents,
        totalFinesCollected: totalFines._sum.fine || 0,
        pendingFines,
        categoryDistribution,
        issuesTimeline,
        recentIssues: recentIssuesList,
        overdueAlerts,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
