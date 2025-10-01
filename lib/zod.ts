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
  dni: string({ required_error: "DNI is required" })
    .min(1, "DNI is required")
    .regex(/^[A-Za-z0-9]{8}$/, "DNI must be exactly 8 alphanumeric characters"),
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
  dni: string({ required_error: "DNI is required" })
    .min(1, "DNI is required")
    .regex(/^[A-Za-z0-9]{8}$/, "DNI must be exactly 8 alphanumeric characters"),
  role: string().optional().default("user").transform((val) => {
    const normalizedRole = val?.toLowerCase();
    if (!normalizedRole || normalizedRole === "user") return "user";
    if (normalizedRole === "admin") return "admin";
    throw new Error("Role must be either 'user' or 'admin'");
  }),
});

// Profile management schemas
export const updateProfileSchema = object({
  name: string({ required_error: "El nombre es requerido" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder los 50 caracteres")
    .trim(),
  dni: string({ required_error: "El DNI es requerido" })
    .min(1, "El DNI es requerido")
    .regex(/^[A-Za-z0-9]{8}$/, "El DNI debe tener exactamente 8 caracteres alfanuméricos")
    .optional(),
});

export const changePasswordSchema = object({
  currentPassword: string({ required_error: "La contraseña actual es requerida" })
    .min(1, "La contraseña actual es requerida"),
  newPassword: string({ required_error: "La nueva contraseña es requerida" })
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(32, "La nueva contraseña no puede exceder los 32 caracteres"),
  confirmPassword: string({ required_error: "La confirmación de contraseña es requerida" })
    .min(1, "La confirmación de contraseña es requerida"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "La nueva contraseña debe ser diferente a la actual",
  path: ["newPassword"],
});

export const totpVerificationSchema = object({
  token: string({ required_error: "El código es requerido" })
    .min(1, "El código es requerido")
    .regex(/^[0-9]{6}$/, "El código debe tener exactamente 6 dígitos"),
  backupCode: string().optional(),
}).refine((data) => data.token || data.backupCode, {
  message: "Se requiere un código TOTP o un código de respaldo",
  path: ["token"],
});

