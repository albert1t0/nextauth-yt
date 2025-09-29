import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Mail, Calendar, Shield, CheckCircle, XCircle } from "lucide-react";

interface AccountInfoProps {
  email: string;
  name: string;
  role: "user" | "admin";
  emailVerified: Date | null;
  createdAt: Date;
}

export function AccountInfo({
  email,
  name,
  role,
  emailVerified,
  createdAt
}: AccountInfoProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isEmailVerified = emailVerified !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Información de la Cuenta
        </CardTitle>
        <CardDescription>
          Detalles de tu cuenta y estado de verificación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Nombre</Label>
          <p className="text-base font-semibold">{name}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Correo Electrónico</Label>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold">{email}</p>
            {isEmailVerified ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Estado de Verificación</Label>
          <div className="flex items-center gap-2">
            <Badge variant={isEmailVerified ? "default" : "secondary"}>
              {isEmailVerified ? "Verificado" : "No verificado"}
            </Badge>
            {emailVerified && (
              <p className="text-sm text-gray-500">
                Verificado el {formatDate(emailVerified)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Rol</Label>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <Badge
              variant={role === "admin" ? "destructive" : "secondary"}
              className="capitalize"
            >
              {role}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Fecha de Creación</Label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <p className="text-sm">{formatDate(createdAt)}</p>
          </div>
        </div>

        {!isEmailVerified && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Tu correo electrónico no está verificado. Por favor, revisa tu bandeja de entrada
              y sigue las instrucciones para verificar tu cuenta.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}