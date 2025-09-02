import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { csvUserImportSchema } from "@/lib/zod";
import Papa from "papaparse";
import bcryptjs from "bcryptjs";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: "File must be a CSV file" },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV content
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { 
          error: "Error parsing CSV file", 
          details: parseResult.errors 
        },
        { status: 400 }
      );
    }

    const parsedData = parseResult.data;

    // Validate required columns
    const requiredColumns = ['name', 'email'];
    const headers = parseResult.meta.fields || [];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          error: "Missing required columns in CSV", 
          missing: missingColumns,
          required: requiredColumns,
          found: headers
        },
        { status: 400 }
      );
    }

    // Validate and process each row
    const validUsers: any[] = [];
    const errors: { row: number; errors: string[] }[] = [];
    let skipped = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i] as any;
      
      try {
        // Validate row data with Zod schema
        const validatedData = csvUserImportSchema.parse(row);
        
        // Check if user already exists
        const existingUser = await db.user.findUnique({
          where: { email: validatedData.email }
        });
        
        if (existingUser) {
          skipped++;
          continue;
        }
        
        // Hash default password
        const hashedPassword = await bcryptjs.hash("defaultpassword123", 12);
        
        validUsers.push({
          name: validatedData.name,
          email: validatedData.email,
          role: validatedData.role,
          password: hashedPassword,
          emailVerified: new Date(), // Auto-verify imported users
        });
        
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push({
            row: i + 1,
            errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          });
        } else {
          errors.push({
            row: i + 1,
            errors: ['Unexpected validation error']
          });
        }
      }
    }

    // Insert valid users in batch
    let created = 0;
    if (validUsers.length > 0) {
      try {
        const result = await db.user.createMany({
          data: validUsers,
          skipDuplicates: true
        });
        created = result.count;
      } catch (dbError) {
        console.error("Database error during batch insert:", dbError);
        return NextResponse.json(
          { error: "Failed to insert users into database" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "CSV import completed",
      summary: {
        created,
        skipped,
        errors: errors.length,
        totalProcessed: parsedData.length
      },
      errors: errors.slice(0, 10) // Limit error details to first 10
    });

  } catch (error) {
    console.error("Error processing CSV import:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}