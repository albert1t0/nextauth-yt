import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { totpSettingsSchema } from "@/lib/zod";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let settings = await db.systemSettings.findFirst({
      orderBy: { createdAt: "asc" }
    });

    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          totpIssuer: "MyApp",
          totpDigits: 6,
          totpPeriod: 30,
        }
      });
    }

    return NextResponse.json({
      totpIssuer: settings.totpIssuer,
      totpDigits: settings.totpDigits,
      totpPeriod: settings.totpPeriod,
    });

  } catch (error) {
    console.error("Error fetching TOTP settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = totpSettingsSchema.parse(body);

    let settings = await db.systemSettings.findFirst({
      orderBy: { createdAt: "asc" }
    });

    if (settings) {
      settings = await db.systemSettings.update({
        where: { id: settings.id },
        data: validatedData
      });
    } else {
      settings = await db.systemSettings.create({
        data: validatedData
      });
    }

    return NextResponse.json({
      totpIssuer: settings.totpIssuer,
      totpDigits: settings.totpDigits,
      totpPeriod: settings.totpPeriod,
    });

  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error updating TOTP settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}