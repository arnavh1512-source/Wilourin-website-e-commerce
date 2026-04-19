'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Package, Tag, Image, Ruler,
  ShoppingBag, Users, Percent, Star, Home, BookOpen,
  Settings, Bot, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/discounts', label: 'Discounts', icon: Percent },
  { href: '/admin/loyalty', label: 'Loyalty', icon: Star },
  { href: '/admin/lookbook', label: 'Lookbook', icon: BookOpen },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/size-guides', label: 'Size Guides', icon: Ruler },
  { href: '/admin/homepage', label: 'Homepage', icon: Home },
  { href: '/admin/advisor', label: 'AI Advisor', icon: Bot },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-56 bg-[#0A0A0A] text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <Link href="/admin" className="font-serif text-lg tracking-wider">WILOURIN</Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest px-5 pt-4 pb-2">Admin Panel</p>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-800 p-3">
          <button onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
            <LogOut size={15} /> Sign Out
          </button>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
            ← Back to Store
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-4 px-5 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600 hover:text-gray-900">
            <Menu size={20} />
          </button>
          <span className="text-sm text-gray-400 capitalize">
            {NAV.find((n) => n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href))?.label ?? 'Admin'}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
