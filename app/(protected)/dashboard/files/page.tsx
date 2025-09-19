"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatFileSize, formatDate } from "@/lib/utils"

interface FileItem {
  id: string
  filename: string
  mimetype: string
  size: number
  createdAt: string
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const [renamingFile, setRenamingFile] = useState<string | null>(null)
  const [newFilename, setNewFilename] = useState("")

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files")
      if (!response.ok) {
        throw new Error("Failed to fetch files")
      }
      const data = await response.json()
      setFiles(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadStatus("uploading")
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      setUploadStatus("success")
      setSelectedFile(null)
      await fetchFiles() // Refresh file list
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
      setUploadStatus("error")
    } finally {
      setTimeout(() => setUploadStatus("idle"), 3000)
    }
  }

  const handleDelete = async (fileId: string) => {
    setDeletingFile(fileId)
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      await fetchFiles() // Refresh file list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeletingFile(null)
    }
  }

  const handleRename = async (fileId: string) => {
    if (!newFilename.trim()) return

    setRenamingFile(fileId)
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: newFilename }),
      })

      if (!response.ok) {
        throw new Error("Rename failed")
      }

      setNewFilename("")
      await fetchFiles() // Refresh file list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed")
    } finally {
      setRenamingFile(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">File Management</h1>
        <p className="text-gray-600">Upload and manage your files</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                disabled={uploadStatus === "uploading"}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </span>
                <Button
                  onClick={handleUpload}
                  disabled={uploadStatus === "uploading"}
                >
                  {uploadStatus === "uploading" ? "Uploading..." : "Upload"}
                </Button>
              </div>
            )}

            {uploadStatus === "success" && (
              <Alert>
                <AlertDescription>File uploaded successfully!</AlertDescription>
              </Alert>
            )}

            {uploadStatus === "error" && uploadError && (
              <Alert variant="destructive">
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No files uploaded yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.filename}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.mimetype}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{formatDate(file.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRenamingFile(file.id)}
                          disabled={renamingFile === file.id}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          disabled={deletingFile === file.id}
                        >
                          {deletingFile === file.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rename Modal (inline for simplicity) */}
      {renamingFile && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CardContent className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Rename File</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newFilename">New Filename</Label>
                <Input
                  id="newFilename"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="Enter new filename"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRenamingFile(null)
                    setNewFilename("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleRename(renamingFile)}
                  disabled={!newFilename.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}