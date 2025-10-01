import FormTotpVerify from "@/components/ui/form-totp-verify";
import Link from "next/link";

export default function VerifyTotpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            NextAuth App
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verificación en Dos Pasos
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Para proteger tu cuenta, necesitamos verificar tu identidad
          </p>
        </div>

        <FormTotpVerify />

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}