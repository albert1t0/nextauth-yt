import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get start of current day for new users calculation
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get start of day 7 days ago for trend calculation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Calculate summary statistics
    const [
      totalUsers,
      newUsersToday,
      totalAdmins,
      activeUsers
    ] = await Promise.all([
      // Total users
      db.user.count(),
      
      // New users today
      db.user.count({
        where: {
          createdAt: {
            gte: startOfDay
          }
        }
      }),
      
      // Total admins
      db.user.count({
        where: {
          role: "admin"
        }
      }),
      
      // Active users (users created in last 30 days)
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      })
    ]);

    // Get 7-day registration trend
    const registrationTrend = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await db.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });
      
      registrationTrend.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        count
      });
    }

    return NextResponse.json({
      summary: {
        totalUsers,
        newUsersToday,
        totalAdmins,
        activeUsers
      },
      registrationTrend
    });

  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}