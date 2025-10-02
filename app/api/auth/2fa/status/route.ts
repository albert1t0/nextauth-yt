import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const twoFactorAuth = await db.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
      select: {
        enabled: true,
        digits: true,
        period: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      enabled: twoFactorAuth?.enabled || false,
      digits: twoFactorAuth?.digits || 6,
      period: twoFactorAuth?.period || 30,
      createdAt: twoFactorAuth?.createdAt,
    });

  } catch (error) {
    console.error("Error fetching 2FA status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}