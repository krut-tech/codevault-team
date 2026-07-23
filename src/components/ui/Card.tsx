import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border-subtle bg-bg-surface shadow-card transition-all duration-200",
        "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-brand-gradient before:opacity-70",
        "hover:z-10 hover:border-brand/30 hover:shadow-glow hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  );
}

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-xl shadow-card transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
