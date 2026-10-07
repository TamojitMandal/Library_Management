import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueBookSchema } from "@/lib/validations";
import { MAX_ACTIVE_ISSUES_PER_STUDENT } from "@/lib/constants";
import { calculateFine } from "@/lib/utils";
import { Prisma, IssueStatus } from "@prisma/client";

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
    const bookQuery = searchParams.get("bookId")?.trim() || "";
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "10", 10)));

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

    if (bookQuery) {
      where.bookId = bookQuery;
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

    const [total, rawIssues] = await Promise.all([
      prisma.issue.count({ where }),
      prisma.issue.findMany({
        where,
        orderBy: { issueDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
              shelfLocation: true,
              coverUrl: true,
            },
          },
          student: {
            select: {
              id: true,
              studentId: true,
              name: true,
              email: true,
              phone: true,
              department: true,
              year: true,
            },
          },
        },
      }),
    ]);

    // Dynamic overdue calculation for accuracy
    const now = new Date();
    const formattedIssues = rawIssues.map((issue) => {
      let currentStatus = issue.status;
      let calculatedFine = issue.fine;

      if (issue.status !== IssueStatus.RETURNED) {
        if (new Date(issue.dueDate) < now) {
          currentStatus = IssueStatus.OVERDUE;
          calculatedFine = calculateFine(issue.dueDate, null);
        }
      }

      return {
        ...issue,
        status: currentStatus,
        fine: calculatedFine,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: formattedIssues,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/issues error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = issueBookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid issue data" },
        { status: 400 }
      );
    }

    const { studentId: inputStudentId, bookId, issueDate, dueDate } = validation.data;

    // 1. Find student by human studentId or cuid
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: inputStudentId }, { studentId: inputStudentId.toUpperCase() }],
      },
      include: {
        issues: {
          where: {
            status: { in: [IssueStatus.ISSUED, IssueStatus.OVERDUE] },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: `Student not found with ID: ${inputStudentId}` },
        { status: 404 }
      );
    }

    // 2. Check maximum active issues limit
    if (student.issues.length >= MAX_ACTIVE_ISSUES_PER_STUDENT) {
      return NextResponse.json(
        {
          success: false,
          error: `Student ${student.name} (${student.studentId}) already has ${student.issues.length} active books (maximum allowed is ${MAX_ACTIVE_ISSUES_PER_STUDENT}). Please return an existing book first.`,
        },
        { status: 400 }
      );
    }

    // 3. Find book & check availability
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ success: false, error: "Book not found" }, { status: 404 });
    }

    if (book.availableCopies <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No copies available for "${book.title}". All ${book.totalCopies} copies are currently issued.`,
        },
        { status: 400 }
      );
    }

    // 4. Atomic Prisma Transaction to decrement copies and record issue
    const newIssue = await prisma.$transaction(async (tx) => {
      // Re-check and decrement atomically
      const updatedBook = await tx.book.update({
        where: { id: bookId, availableCopies: { gt: 0 } },
        data: {
          availableCopies: { decrement: 1 },
        },
      });

      if (!updatedBook) {
        throw new Error("Concurrent issue conflict: Book copy is no longer available");
      }

      const issue = await tx.issue.create({
        data: {
          bookId,
          studentId: student.id,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          status: IssueStatus.ISSUED,
          fine: 0,
        },
        include: {
          book: true,
          student: true,
        },
      });

      return issue;
    });

    return NextResponse.json({ success: true, data: newIssue }, { status: 201 });
  } catch (error) {
    console.error("POST /api/issues error:", error);
    const message = error instanceof Error ? error.message : "Failed to issue book";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
