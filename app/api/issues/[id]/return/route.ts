import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { returnBookSchema } from "@/lib/validations";
import { calculateFine } from "@/lib/utils";
import { IssueStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is allowed, defaults to today
    }

    const validation = returnBookSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid return data" },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        book: true,
        student: true,
      },
    });

    if (!issue) {
      return NextResponse.json({ success: false, error: "Issue record not found" }, { status: 404 });
    }

    if (issue.status === IssueStatus.RETURNED) {
      return NextResponse.json(
        { success: false, error: "This book has already been marked as returned" },
        { status: 400 }
      );
    }

    const returnDate = validation.data.returnDate ? new Date(validation.data.returnDate) : new Date();

    // Calculate fine: Rs. 5 per overdue day
    const fine = calculateFine(issue.dueDate, returnDate);

    // Atomically update issue and increment book available copies
    const updated = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { id },
        data: {
          returnDate,
          status: IssueStatus.RETURNED,
          fine,
        },
        include: {
          book: true,
          student: true,
        },
      });

      // Increment available copies without exceeding totalCopies
      await tx.book.update({
        where: { id: issue.bookId },
        data: {
          availableCopies: {
            increment: 1,
          },
        },
      });

      return updatedIssue;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Book returned successfully.${fine > 0 ? ` Overdue fine: ₹${fine}` : ""}`,
    });
  } catch (error) {
    console.error("POST /api/issues/[id]/return error:", error);
    return NextResponse.json({ success: false, error: "Failed to return book" }, { status: 500 });
  }
}
