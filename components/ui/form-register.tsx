"use client";

import { z } from "zod";
import { registerSchema } from "@/lib/zod";
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
import { registerAction } from "@/action/auth-action";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";


const FormRegister = () => {

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

    const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      dni: "",
    },
  })

async function onSubmit(values: z.infer<typeof registerSchema>) {
    setError(null);
    startTransition(async() => {
      const response = await registerAction(values, "/auth/post-login");
      if(response.error) {
        setError(response.error);
      } else {
        // La redirección ahora será manejada por NextAuth con el callbackUrl
        router.push("/auth/post-login");
      }
    });
  } 
  
return ( <div className="max-w-80">
    <h1>Register</h1><br />
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="name"
                  type="text"
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
          name="dni"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DNI</FormLabel>
              <FormControl>
                <Input
                  placeholder="00000000"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                8 caracteres alfanuméricos
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <Button type="submit" disabled={isPending}>Registrarse</Button>
      </form>
    </Form></div>
  )
}

export default FormRegister;