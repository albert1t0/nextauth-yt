"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useState, useTransition } from "react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo válida." }),
});

const FormForgotPassword = () => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/request-password-reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.errors) {
            const zodErrors = data.errors as { [key: string]: string[] };
            const firstErrorKey = Object.keys(zodErrors)[0];
            const firstErrorMessage = zodErrors[firstErrorKey]?.[0];
            throw new Error(firstErrorMessage || 'Error de validación.');
          }
          throw new Error(data.message || 'Ocurrió un error en el servidor.');
        }
        
        setSuccessMessage(data.message);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Ocurrió un error inesperado.");
      }
    });
  }

  return (
    <div className="max-w-80">
      <h1>Restablecer Contraseña</h1>
      <p className="text-sm text-gray-600 mb-4">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="email@ejemplo.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <FormMessage>{error}</FormMessage>}
          {successMessage && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              {successMessage}
            </div>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enviando..." : "Enviar Enlace"}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default FormForgotPassword; 