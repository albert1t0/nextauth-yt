"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface NavigationCardProps {
  title: string
  description: string
  href?: string
  icon: LucideIcon
  disabled?: boolean
  className?: string
}

export function NavigationCard({
  title,
  description,
  href,
  icon: Icon,
  disabled = false,
  className
}: NavigationCardProps) {
  const cardContent = (
    <Card className={cn(
      "h-full transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer",
      disabled && "opacity-50 cursor-not-allowed hover:shadow-none hover:scale-100",
      className
    )}>
      <CardHeader className="text-center">
        <div className={cn(
          "mx-auto w-12 h-12 flex items-center justify-center rounded-lg mb-4",
          !disabled && "bg-primary/10 hover:bg-primary/20 transition-colors",
          disabled && "bg-muted"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            !disabled && "text-primary",
            disabled && "text-muted-foreground"
          )} />
        </div>
        <CardTitle className={cn(
          "text-lg",
          !disabled && "group-hover:text-primary transition-colors",
          disabled && "text-muted-foreground"
        )}>
          {title}
        </CardTitle>
        <CardDescription className={cn(
          "text-sm",
          disabled && "text-muted-foreground"
        )}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {disabled && (
          <div className="text-xs text-muted-foreground text-center font-medium">
            Próximamente
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (disabled) {
    return cardContent
  }

  return (
    <Link href={href || "#"} className="block h-full group">
      {cardContent}
    </Link>
  )
}