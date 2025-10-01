"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransition } from "react";
import { updateProfileAction } from "@/action/user-action";
import { updateProfileSchema } from "@/lib/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User } from "lucide-react";

interface FormProfileProps {
  initialName: string;
  initialDni?: string;
  onProfileUpdate?: (updatedName: string) => void;
}

export function FormProfile({ initialName, initialDni, onProfileUpdate }: FormProfileProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialName || "",
      dni: initialDni || "",
    },
  });

  async function onSubmit(values: z.infer<typeof updateProfileSchema>) {
    startTransition(async () => {
      try {
        const result = await updateProfileAction(values);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(result.success || "Perfil actualizado correctamente");

          // Notificar al componente padre sobre la actualización
          if (onProfileUpdate) {
            onProfileUpdate(values.name);
          }

          // Opcional: Refrescar la página para mostrar los datos actualizados
          router.refresh();
        }
      } catch {
        toast.error("Error al actualizar el perfil");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Actualizar Perfil
        </CardTitle>
        <CardDescription>
          Actualiza tu información personal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tu nombre"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000000"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    8 caracteres alfanuméricos (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Actualizando..." : "Guardar cambios"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}