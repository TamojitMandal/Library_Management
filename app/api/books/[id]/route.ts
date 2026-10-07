import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        issues: {
          include: {
            student: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!book) {
      return NextResponse.json({ success: false, error: "Book not found" }, { status: 404 });
    }

    const activeIssuesCount = await prisma.issue.count({
      where: {
        bookId: id,
        status: { in: ["ISSUED", "OVERDUE"] },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...book,
        activeIssuesCount,
      },
    });
  } catch (error) {
    console.error("GET /api/books/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch book" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = bookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check existing book
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return NextResponse.json({ success: false, error: "Book not found" }, { status: 404 });
    }

    // Check duplicate ISBN if changed
    if (data.isbn !== existingBook.isbn) {
      const isbnConflict = await prisma.book.findUnique({
        where: { isbn: data.isbn },
      });
      if (isbnConflict) {
        return NextResponse.json(
          { success: false, error: `ISBN "${data.isbn}" is already used by another book: ${isbnConflict.title}` },
          { status: 409 }
        );
      }
    }

    // Check active issues count
    const activeIssuesCount = await prisma.issue.count({
      where: {
        bookId: id,
        status: { in: ["ISSUED", "OVERDUE"] },
      },
    });

    if (data.totalCopies < activeIssuesCount) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reduce total copies to ${data.totalCopies}. There are currently ${activeIssuesCount} copies issued to students.`,
        },
        { status: 400 }
      );
    }

    // Calculate new available copies based on new total and current active issues
    const newAvailableCopies = data.totalCopies - activeIssuesCount;

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        category: data.category,
        totalCopies: data.totalCopies,
        availableCopies: newAvailableCopies,
        shelfLocation: data.shelfLocation,
        coverUrl: data.coverUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: updatedBook });
  } catch (error) {
    console.error("PUT /api/books/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check active issues
    const activeIssuesCount = await prisma.issue.count({
      where: {
        bookId: id,
        status: { in: ["ISSUED", "OVERDUE"] },
      },
    });

    if (activeIssuesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete book. There are currently ${activeIssuesCount} active issued copies. Please mark them as returned first.`,
        },
        { status: 400 }
      );
    }

    // If there are historical returned issues, delete them or handle cascade
    await prisma.issue.deleteMany({
      where: { bookId: id },
    });

    await prisma.book.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/books/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete book" }, { status: 500 });
  }
}
