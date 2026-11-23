import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { currentCurrency } from './settings'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = currentCurrency()): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
