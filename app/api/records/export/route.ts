import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { calculateFine } from "@/lib/utils";
import { Prisma, IssueStatus } from "@prisma/client";

function escapeCsv(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const stringVal = String(field).replace(/"/g, '""');
  return `"${stringVal}"`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.trim().toUpperCase();
    const search = searchParams.get("search")?.trim() || "";
    const studentQuery = searchParams.get("studentId")?.trim() || "";
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const where: Prisma.IssueWhereInput = {};

    if (statusParam && statusParam !== "ALL") {
      if (statusParam in IssueStatus) {
        where.status = statusParam as IssueStatus;
      }
    }

    if (studentQuery) {
      where.OR = [
        { studentId: studentQuery },
        { student: { studentId: { contains: studentQuery, mode: "insensitive" } } },
      ];
    }

    if (search) {
      where.OR = [
        { book: { title: { contains: search, mode: "insensitive" } } },
        { book: { isbn: { contains: search, mode: "insensitive" } } },
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { studentId: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (fromDate || toDate) {
      where.issueDate = {};
      if (fromDate) where.issueDate.gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.issueDate.lte = end;
      }
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { issueDate: "desc" },
      include: {
        book: true,
        student: true,
      },
    });

    const now = new Date();
    const headers = [
      "Issue ID",
      "Student ID",
      "Student Name",
      "Department",
      "Year",
      "Book Title",
      "Book ISBN",
      "Shelf Location",
      "Issue Date",
      "Due Date",
      "Return Date",
      "Status",
      "Fine (INR)",
    ];

    const rows = issues.map((issue) => {
      let status = issue.status;
      let fine = issue.fine;

      if (issue.status !== IssueStatus.RETURNED && new Date(issue.dueDate) < now) {
        status = IssueStatus.OVERDUE;
        fine = calculateFine(issue.dueDate, null);
      }

      return [
        issue.id,
        issue.student.studentId,
        issue.student.name,
        issue.student.department,
        issue.student.year,
        issue.book.title,
        issue.book.isbn,
        issue.book.shelfLocation,
        format(new Date(issue.issueDate), "yyyy-MM-dd"),
        format(new Date(issue.dueDate), "yyyy-MM-dd"),
        issue.returnDate ? format(new Date(issue.returnDate), "yyyy-MM-dd") : "Not Returned",
        status,
        fine,
      ].map(escapeCsv).join(",");
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const filename = `library-records-${format(now, "yyyyMMdd-HHmm")}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/records/export error:", error);
    return NextResponse.json({ success: false, error: "Failed to export CSV" }, { status: 500 });
  }
}
