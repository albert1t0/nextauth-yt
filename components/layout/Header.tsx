import Link from "next/link";
import { Button } from "../ui/button";

export default function Header() {
  return (
    <header className="w-full flex justify-between items-center py-4 px-6 md:px-12 border-b bg-white/80 backdrop-blur-md">
      <h2 className="text-xl font-bold tracking-tight">Multiplataforma - DIAD</h2>
      <Link href="/login">
        <Button variant="outline">Iniciar Sesión</Button>
      </Link>
    </header>
  );
} 