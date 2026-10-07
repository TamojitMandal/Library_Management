import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const availableOnly = searchParams.get("available") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "10", 10)));

    const where: Prisma.BookWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (availableOnly) {
      where.availableCopies = { gt: 0 };
    }

    const [total, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: { issues: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: books,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/books error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = bookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check duplicate ISBN
    const existingIsbn = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    });

    if (existingIsbn) {
      return NextResponse.json(
        { success: false, error: `A book with ISBN "${data.isbn}" already exists: ${existingIsbn.title}` },
        { status: 409 }
      );
    }

    const availableCopies =
      data.availableCopies !== undefined ? data.availableCopies : data.totalCopies;

    if (availableCopies > data.totalCopies) {
      return NextResponse.json(
        { success: false, error: "Available copies cannot exceed total copies" },
        { status: 400 }
      );
    }

    const newBook = await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        category: data.category,
        totalCopies: data.totalCopies,
        availableCopies,
        shelfLocation: data.shelfLocation,
        coverUrl: data.coverUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: newBook }, { status: 201 });
  } catch (error) {
    console.error("POST /api/books error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add book" },
      { status: 500 }
    );
  }
}
