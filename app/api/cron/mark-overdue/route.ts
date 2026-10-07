import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateFine } from "@/lib/utils";
import { IssueStatus } from "@prisma/client";

export async function GET() {
  return handleMarkOverdue();
}

export async function POST() {
  return handleMarkOverdue();
}

async function handleMarkOverdue() {
  try {
    const now = new Date();

    const overdueIssues = await prisma.issue.findMany({
      where: {
        status: IssueStatus.ISSUED,
        dueDate: { lt: now },
        returnDate: null,
      },
    });

    let updatedCount = 0;
    for (const issue of overdueIssues) {
      const fine = calculateFine(issue.dueDate, null);
      await prisma.issue.update({
        where: { id: issue.id },
        data: {
          status: IssueStatus.OVERDUE,
          fine,
        },
      });
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${updatedCount} issues as overdue and updated fines`,
      updatedCount,
    });
  } catch (error) {
    console.error("Cron mark-overdue error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark overdue records" },
      { status: 500 }
    );
  }
}
