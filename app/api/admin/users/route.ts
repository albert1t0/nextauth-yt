import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma, Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Validate role parameter if provided
    if (role && !["user", "admin"].includes(role.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid role parameter. Must be 'user' or 'admin'" },
        { status: 400 }
      );
    }

    // Calculate skip and take for pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Build dynamic where clause for filtering
    const whereClause: Prisma.UserWhereInput = {};

    // Add search filter for name and email
    if (search && search.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    // Add role filter
    if (role && role.trim()) {
      whereClause.role = role.toLowerCase() as Role;
    }

    // Get users and total count with filters
    const [users, totalUsers] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          isTwoFactorForced: true,
          createdAt: true,
          updatedAt: true,
          twoFactorAuth: {
            select: {
              enabled: true
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.user.count({
        where: whereClause,
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}