"use client";

import { z } from "zod";
import { loginSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { loginAction } from "@/action/auth-action";
import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";


const FormLogin = () => {

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Verificar si el usuario viene de una verificación exitosa
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "1") {
      setSuccessMessage("Correo verificado. Ya puede ingresar.");
    }
  }, [searchParams]);

    const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError(null);
    setSuccessMessage(null);
    startTransition(async() => {
      try {
        await loginAction(values);
        router.push("/dashboard");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Error de autenticación");
      }
    });
  } 
  
return ( <div className="max-w-80">
    <h1 className="text-2xl font-bold text-center my-8">Inicio de sesión en la plataforma</h1>
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
                  placeholder="email"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormDescription>
              
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  placeholder="password"
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormDescription>
              
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {
          error && <FormMessage>{error}</FormMessage>
        }
        {
          successMessage && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              {successMessage}
            </div>
          )
        }
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
        <Button type="submit" disabled={isPending}>Iniciar Sesión</Button>
      </form>
    </Form></div>
  )
}

export default FormLogin;