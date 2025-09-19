import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { z } from "zod"

const updateFileSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { fileId } = params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateFileSchema.parse(body)

    // Find the file and verify ownership
    const file = await db.file.findUnique({
      where: { id: fileId },
    })

    if (!file || file.userId !== session.user.id) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Update the file
    const updatedFile = await db.file.update({
      where: { id: fileId },
      data: {
        filename: validatedData.filename,
      },
    })

    return NextResponse.json(updatedFile)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Check if user is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { fileId } = params

    // Find the file and verify ownership
    const file = await db.file.findUnique({
      where: { id: fileId },
    })

    if (!file || file.userId !== session.user.id) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Delete the physical file
    try {
      await unlink(file.storagePath)
    } catch (error) {
      // If file doesn't exist, continue with database deletion
      console.warn("File not found on disk:", file.storagePath)
    }

    // Delete the database record
    await db.file.delete({
      where: { id: fileId },
    })

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}