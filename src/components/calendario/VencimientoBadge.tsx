"use client";

import { cn } from "@/lib/utils";

interface VencimientoBadgeProps {
  days: number;
  showText?: boolean;
  estado?: string;
  className?: string;
}

export function getUrgencyConfig(days: number, estado?: string) {
  if (estado === "PAGADO" || estado === "PRESENTADO") {
    return {
      bg: "bg-gray-100",
      text: "text-gray-500",
      border: "border-gray-200",
      label: "Realizado",
      dot: "bg-gray-400",
      pulse: false,
    };
  }
  if (estado === "VENCIDO" || days < 0) {
    return {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      label: days < 0 ? `${Math.abs(days)}d vencido` : "Vencido",
      dot: "bg-red-500",
      pulse: true,
    };
  }
  if (days === 0) {
    return {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      label: "¡Hoy!",
      dot: "bg-red-500",
      pulse: true,
    };
  }
  if (days <= 3) {
    return {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      label: `${days}d`,
      dot: "bg-red-500",
      pulse: true,
    };
  }
  if (days <= 7) {
    return {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-200",
      label: `${days}d`,
      dot: "bg-orange-500",
      pulse: false,
    };
  }
  if (days <= 15) {
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      label: `${days}d`,
      dot: "bg-yellow-500",
      pulse: false,
    };
  }
  return {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    label: `${days}d`,
    dot: "bg-green-500",
    pulse: false,
  };
}

export default function VencimientoBadge({
  days,
  showText = true,
  estado,
  className,
}: VencimientoBadgeProps) {
  const config = getUrgencyConfig(days, estado);
  const isCompleted = estado === "PAGADO" || estado === "PRESENTADO";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          config.dot,
          config.pulse && !isCompleted && "animate-pulse"
        )}
      />
      {showText && (
        <span>
          {isCompleted
            ? "Realizado"
            : days < 0
            ? `${Math.abs(days)}d vencido`
            : days === 0
            ? "¡Hoy!"
            : `${days} días`}
        </span>
      )}
    </span>
  );
}
