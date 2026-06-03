import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: es })
}

export function getDaysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date
  return differenceInDays(d, new Date())
}

export function getVencimientoColor(days: number): string {
  if (days < 0) return 'destructive'
  if (days <= 3) return 'destructive'
  if (days <= 7) return 'orange'
  if (days <= 15) return 'yellow'
  return 'green'
}

export function getVencimientoBg(days: number): string {
  if (days < 0) return 'bg-red-100 text-red-800 border-red-200'
  if (days <= 3) return 'bg-red-100 text-red-800 border-red-200'
  if (days <= 7) return 'bg-orange-100 text-orange-800 border-orange-200'
  if (days <= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-green-100 text-green-800 border-green-200'
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}
