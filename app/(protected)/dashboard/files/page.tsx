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
import { ArrowLeft, Home, FolderOpen, Upload, File, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

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
  const [isDragOver, setIsDragOver] = useState(false)

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files")
      if (!response.ok) {
        throw new Error("Error al obtener archivos")
      }
      const data = await response.json()
      setFiles(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
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

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files.length > 0) {
      setSelectedFile(files[0])
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
        throw new Error(errorData.error || "Error al subir archivo")
      }

      setUploadStatus("success")
      setSelectedFile(null)
      await fetchFiles() // Refresh file list
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir archivo")
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
        throw new Error("Error al eliminar")
      }

      await fetchFiles() // Refresh file list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar")
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
        throw new Error("Error al renombrar")
      }

      setNewFilename("")
      await fetchFiles() // Refresh file list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al renombrar")
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
    <div className="container mx-auto py-8 space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Dashboard</span>
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Inicio</span>
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <FolderOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Archivos</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Sube, organiza y gestiona tus archivos de manera segura
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nuevo Archivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${isDragOver
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
              }
              ${selectedFile ? 'bg-green-50 border-green-300' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={(inputEl) => {
                if (inputEl) {
                  inputEl.style.display = 'none'
                }
              }}
              id="file"
              type="file"
              onChange={handleFileSelect}
              disabled={uploadStatus === "uploading"}
            />

            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedFile ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  {selectedFile ? 'Archivo seleccionado' : 'Arrastra y suelta tu archivo aquí'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedFile
                    ? selectedFile.name
                    : 'o haz clic para seleccionarlo'
                  }
                </p>
                {selectedFile && (
                  <p className="text-xs text-gray-600">
                    Tamaño: {formatFileSize(selectedFile.size)}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => document.getElementById('file')?.click()}
                  variant="outline"
                  className="px-6 py-2"
                  disabled={uploadStatus === "uploading"}
                >
                  <File className="h-4 w-4 mr-2" />
                  Examinar Archivos
                </Button>
              </div>
            </div>
          </div>

          {/* Selected File Actions */}
          {selectedFile && (
            <div className="space-y-4 p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setUploadStatus("idle")
                      setUploadError(null)
                    }}
                    >
                    Cambiar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadStatus === "uploading"}
                    className="min-w-[100px]"
                  >
                    {uploadStatus === "uploading" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Archivo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                ¡Archivo subido exitosamente!
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === "error" && uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Tus Archivos</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aún no hay archivos subidos
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de Archivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha de Subida</TableHead>
                  <TableHead>Acciones</TableHead>
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
                          Renombrar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          disabled={deletingFile === file.id}
                        >
                          {deletingFile === file.id ? "Eliminando..." : "Eliminar"}
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

      {/* Return to Dashboard Section */}
      <div className="mt-12 text-center border-t pt-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Has terminado de gestionar tus archivos?
            </h3>
          </div>
          <p className="text-gray-600">
            Vuelve al panel principal para acceder a otras funciones
          </p>
          <Link href="/dashboard">
            <Button className="flex items-center space-x-2 mx-auto">
              <Home className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Rename Modal (inline for simplicity) */}
      {renamingFile && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CardContent className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Renombrar Archivo</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newFilename">Nuevo Nombre de Archivo</Label>
                <Input
                  id="newFilename"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="Ingresa el nuevo nombre del archivo"
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
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleRename(renamingFile)}
                  disabled={!newFilename.trim()}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}