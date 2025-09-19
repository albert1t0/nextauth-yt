import { Button } from "@/components/ui/button"
import { ArrowLeft, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReturnToDashboardButtonProps {
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ReturnToDashboardButton({
  className,
  variant = "outline",
  size = "sm"
}: ReturnToDashboardButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "flex items-center gap-2 transition-all duration-200 hover:gap-3",
        className
      )}
    >
      <ArrowLeft className="w-4 h-4" />
      <LayoutDashboard className="w-4 h-4" />
      Volver al Dashboard
    </Button>
  )
}