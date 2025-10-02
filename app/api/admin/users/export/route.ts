import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Papa from 'papaparse';

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        dni: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert to CSV
    const csvData = users.map(user => ({
      ID: user.id,
      Nombre: user.name || '',
      Email: user.email,
      DNI: user.dni || '',
      Rol: user.role,
      'Email Verificado': user.emailVerified ? 'Sí' : 'No',
      'Fecha Creación': user.createdAt.toLocaleDateString('es-ES'),
      'Fecha Actualización': user.updatedAt.toLocaleDateString('es-ES'),
    }));

    const csv = Papa.unparse(csvData);

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="usuarios-export.csv"',
      },
    });

  } catch (error) {
    console.error("Error exporting users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}