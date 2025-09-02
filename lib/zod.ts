import { object, string, enum as zodEnum } from "zod"
 
export const loginSchema = object({
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export const registerSchema = object({
  name: string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(32, "Name must be less than 32 characters"),
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export const updateUserRoleSchema = object({
  role: zodEnum(["user", "admin"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be either 'user' or 'admin'",
  }),
});

export const csvUserImportSchema = object({
  name: string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email format"),
  role: string().optional().default("user").transform((val) => {
    const normalizedRole = val?.toLowerCase();
    if (!normalizedRole || normalizedRole === "user") return "user";
    if (normalizedRole === "admin") return "admin";
    throw new Error("Role must be either 'user' or 'admin'");
  }),
});

