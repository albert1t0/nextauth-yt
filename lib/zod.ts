import { object, string, enum as zodEnum, coerce, number } from "zod"
 
export const loginSchema = object({
  email: string({ required_error: "El email es requerido" })
    .min(1, "El email es requerido")
    .email("Email inválido"),
  password: string({ required_error: "La contraseña es requerida" })
    .min(1, "La contraseña es requerida")
    .min(8, "La contraseña debe tener más de 8 caracteres")
    .max(32, "La contraseña debe tener menos de 32 caracteres"),
});

export const registerSchema = object({
  name: string({ required_error: "El nombre es requerido" })
    .min(1, "El nombre es requerido")
    .max(32, "El nombre debe tener menos de 32 caracteres"),
  email: string({ required_error: "El email es requerido" })
    .min(1, "El email es requerido")
    .email("Email inválido"),
  dni: string({ required_error: "El DNI es requerido" })
    .min(1, "El DNI es requerido")
    .regex(/^[A-Za-z0-9]{8}$/, "El DNI debe tener exactamente 8 caracteres alfanuméricos"),
  password: string({ required_error: "La contraseña es requerida" })
    .min(1, "La contraseña es requerida")
    .min(8, "La contraseña debe tener más de 8 caracteres")
    .max(32, "La contraseña debe tener menos de 32 caracteres"),
});

export const updateUserRoleSchema = object({
  role: zodEnum(["user", "admin"], {
    required_error: "El rol es requerido",
    invalid_type_error: "El rol debe ser 'user' o 'admin'",
  }),
});

export const csvUserImportSchema = object({
  name: string({ required_error: "El nombre es requerido" })
    .min(1, "El nombre es requerido")
    .max(100, "El nombre debe tener menos de 100 caracteres"),
  email: string({ required_error: "El email es requerido" })
    .min(1, "El email es requerido")
    .email("Formato de email inválido"),
  dni: string({ required_error: "El DNI es requerido" })
    .min(1, "El DNI es requerido")
    .regex(/^[A-Za-z0-9]{8}$/, "El DNI debe tener exactamente 8 caracteres alfanuméricos"),
  password: string().optional().transform((val) => {
    if (!val || val.trim() === '') return null;
    if (val.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");
    if (val.length > 32) throw new Error("La contraseña no puede exceder 32 caracteres");
    return val;
  }),
  role: string().optional().default("user").transform((val) => {
    const normalizedRole = val?.toLowerCase();
    if (!normalizedRole || normalizedRole === "user") return "user";
    if (normalizedRole === "admin") return "admin";
    throw new Error("El rol debe ser 'user' o 'admin'");
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

export const totpSettingsSchema = object({
  totpIssuer: string({ required_error: "El issuer es requerido" })
    .min(1, "El issuer es requerido")
    .max(50, "El issuer no puede exceder los 50 caracteres"),
  totpDigits: coerce.number()
    .refine((val) => val === 6 || val === 8, {
      message: "Los dígitos deben ser 6 u 8",
    }),
  totpPeriod: coerce.number()
    .refine((val) => val >= 30 && val <= 1800, {
      message: "El período debe estar entre 30 y 1800 segundos",
    }),
});

