"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, Shield, ShieldOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: string | null;
  isTwoFactorForced: boolean;
  dni: string | null;
  twoFactorAuth?: {
    enabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updating2FAUserId, setUpdating2FAUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingDNI, setEditingDNI] = useState<string>("");

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el rol del usuario");
      }

      const updatedUser = await response.json();
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: updatedUser.user.role } : user
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const updateUser2FAStatus = async (userId: string, force2FA: boolean) => {
    try {
      setUpdating2FAUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}/force-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isTwoFactorForced: force2FA }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar estado 2FA del usuario");
      }

      const updatedUser = await response.json();

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? {
                ...user,
                isTwoFactorForced: updatedUser.user.isTwoFactorForced,
                twoFactorAuth: updatedUser.user.twoFactorAuth
              }
            : user
        )
      );

      toast.success(
        force2FA
          ? "2FA forzado correctamente"
          : "2FA forzado desactivado"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUpdating2FAUserId(null);
    }
  };

  const updateUserDNI = async (userId: string, newDNI: string) => {
    try {
      setUpdatingUserId(userId);

      // Validar formato del DNI
      const dniRegex = /^[A-Za-z0-9]{8}$/;
      if (newDNI && !dniRegex.test(newDNI)) {
        toast.error("El DNI debe tener exactamente 8 caracteres alfanuméricos");
        return;
      }

      // Verificar que el DNI no exista si se está actualizando
      if (newDNI) {
        const checkResponse = await fetch(`/api/admin/users/check-dni?dni=${encodeURIComponent(newDNI)}&userId=${userId}`);
        if (!checkResponse.ok) {
          const errorData = await checkResponse.json();
          toast.error(errorData.error || "Error al validar DNI");
          return;
        }
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dni: newDNI || null }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el DNI del usuario");
      }

      const updatedUser = await response.json();

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, dni: updatedUser.user.dni } : user
        )
      );

      toast.success("DNI actualizado correctamente");
      setEditingUserId(null);
      setEditingDNI("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const startEditingDNI = (userId: string, currentDNI: string | null) => {
    setEditingUserId(userId);
    setEditingDNI(currentDNI || "");
  };

  const cancelEditingDNI = () => {
    setEditingUserId(null);
    setEditingDNI("");
  };

  const fetchUsers = async (page: number = 1, search: string = "", role: string = "all") => {
    try {
      setLoading(true);
      let url = `/api/admin/users?page=${page}&limit=10`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (role !== "all") {
        url += `&role=${encodeURIComponent(role)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1, searchTerm, roleFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">Cargando usuarios...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-32">
              <p className="text-red-500">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600">Total: {pagination.totalUsers} usuarios</p>
        </div>
        <Link href="/admin/users/import">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Email Verificado</TableHead>
                <TableHead>Autenticación 2FA</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || "Sin nombre"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {editingUserId === user.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={editingDNI}
                          onChange={(e) => setEditingDNI(e.target.value)}
                          placeholder="00000000"
                          className="w-24"
                          maxLength={8}
                        />
                        <Button
                          size="sm"
                          onClick={() => updateUserDNI(user.id, editingDNI)}
                          disabled={updatingUserId === user.id}
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditingDNI}
                          disabled={updatingUserId === user.id}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={user.dni ? "" : "text-gray-400 italic"}>
                          {user.dni || "Sin DNI"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingDNI(user.id, user.dni)}
                          disabled={updatingUserId === user.id}
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role === "admin" ? "Admin" : "Usuario"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.emailVerified ? "default" : "destructive"}
                    >
                      {user.emailVerified ? "Verificado" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge
                        variant={user.twoFactorAuth?.enabled ? "default" : "secondary"}
                      >
                        {user.twoFactorAuth?.enabled ? "Habilitado" : "Deshabilitado"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={user.isTwoFactorForced ? "default" : "outline"}
                        onClick={() => updateUser2FAStatus(user.id, !user.isTwoFactorForced)}
                        disabled={updating2FAUserId === user.id}
                        className="w-full"
                      >
                        {updating2FAUserId === user.id ? (
                          "Actualizando..."
                        ) : user.isTwoFactorForced ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Forzado
                          </>
                        ) : (
                          <>
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Forzar 2FA
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                      disabled={updatingUserId === user.id}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => fetchUsers(pagination.currentPage - 1, searchTerm, roleFilter)}
                      className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => fetchUsers(page, searchTerm, roleFilter)}
                        isActive={page === pagination.currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => fetchUsers(pagination.currentPage + 1, searchTerm, roleFilter)}
                      className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}