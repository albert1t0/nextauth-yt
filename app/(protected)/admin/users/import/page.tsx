"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ImportResult {
  created: number;
  skipped: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

export default function AdminUsersImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setFile(null);
      setError("Por favor selecciona un archivo CSV válido");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Por favor selecciona un archivo CSV");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/users/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al importar usuarios");
      }

      const data = await response.json();
      setResult(data);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById("csv-file") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Usuarios
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Importar Usuarios</h1>
          <p className="text-gray-600">Sube un archivo CSV para importar usuarios masivamente</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Archivo CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                El archivo debe contener columnas: name, email, role (opcional)
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? "Importando..." : "Importar Usuarios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resultado de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  {result.created} creados
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {result.skipped} omitidos
                </Badge>
              </div>
              {result.errors.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {result.errors.length} errores
                  </Badge>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-500">Errores encontrados:</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                      <span className="font-medium">Fila {error.row}:</span>
                      <ul className="list-disc list-inside ml-2">
                        {error.errors.map((err, errIndex) => (
                          <li key={errIndex} className="text-red-700">{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Formato del CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>El archivo CSV debe tener el siguiente formato:</p>
            <div className="bg-gray-100 p-3 rounded font-mono text-xs">
              name,email,role<br/>
              Juan Pérez,juan@example.com,user<br/>
              María García,maria@example.com,admin<br/>
              Carlos López,carlos@example.com
            </div>
            <div className="space-y-1">
              <p><strong>Columnas requeridas:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li><code>name</code> - Nombre completo del usuario</li>
                <li><code>email</code> - Email válido</li>
              </ul>
              <p><strong>Columna opcional:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li><code>role</code> - &quot;user&quot; o &quot;admin&quot; (por defecto: &quot;user&quot;)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}