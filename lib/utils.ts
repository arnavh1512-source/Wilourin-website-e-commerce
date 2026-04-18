import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { randomBytes } from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateOrderNumber(): string {
  return `WIL-${randomBytes(16).toString('hex').toUpperCase()}`
}

export function calculateDiscountedPrice(price: number, originalPrice: number | null): number {
  if (!originalPrice || originalPrice <= price) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

export function getLoyaltyTier(points: number): 'Bronze' | 'Silver' | 'Gold' {
  if (points >= 5000) return 'Gold'
  if (points >= 1000) return 'Silver'
  return 'Bronze'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

export function isLowStock(stockQty: number): boolean {
  return stockQty > 0 && stockQty < 5
}

export function isOutOfStock(stockQty: number): boolean {
  return stockQty === 0
}

export function getEstimatedDelivery(shippingMethod: 'Standard' | 'Express', days: string): string {
  const match = days.match(/(\d+)-(\d+)/)
  if (!match) return days
  const minDays = parseInt(match[1])
  const maxDays = parseInt(match[2])
  const minDate = new Date()
  const maxDate = new Date()
  minDate.setDate(minDate.getDate() + minDays)
  maxDate.setDate(maxDate.getDate() + maxDays)
  return `${minDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${maxDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
}

export const SCARCITY_MESSAGES = [
  'Trending this week',
  'Flash sale — limited time',
  'Most loved item this season',
  'Back in stock — get it before it sells out',
  'Ships to 50+ countries',
  'Premium Indian streetwear',
  'Limited edition drop',
  'Customer favourite',
]

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]
