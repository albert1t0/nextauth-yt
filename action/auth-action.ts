"use server";

import { z } from "zod";
import { loginSchema } from "@/lib/zod";
import { signIn } from "@/auth";

export const loginAction = async (
    values: z.infer<typeof loginSchema> 
) => {
    try {
        await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
        }); 
    } catch (error) {
        console.error("Login failed:", error);
        throw new Error("Login failed");
    }
};      
