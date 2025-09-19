import { auth } from "@/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"

// Disable Next.js body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory already exists or created
    }

    // Generate unique filename to avoid collisions
    const fileExtension = file.name.split(".").pop() || ""
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
    const storagePath = join(uploadsDir, uniqueFilename)

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(storagePath, buffer)

    // Create file record in database
    const fileRecord = await db.file.create({
      data: {
        filename: file.name,
        storagePath: storagePath,
        mimetype: file.type,
        size: file.size,
        userId: session.user.id,
      },
    })

    return NextResponse.json(
      {
        id: fileRecord.id,
        filename: fileRecord.filename,
        size: fileRecord.size,
        mimetype: fileRecord.mimetype,
        createdAt: fileRecord.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}