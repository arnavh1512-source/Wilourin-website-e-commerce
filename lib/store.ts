'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, WishlistProduct, Profile, Toast, ToastType, AdvisorMessage } from './types'

// ─── CART STORE ──────────────────────────────────────────

interface CartStore {
  items: CartItem[]
  promoCode: string | null
  discountAmount: number
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  setPromoCode: (code: string | null, discount: number) => void
  getSubtotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      discountAmount: 0,

      addItem: (newItem) => set((state) => {
        const existing = state.items.find((i) => i.id === newItem.id)
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.id === newItem.id
                ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.stock_qty) }
                : i
            ),
          }
        }
        return { items: [...state.items, newItem] }
      }),

      removeItem: (variantId) => set((state) => ({
        items: state.items.filter((i) => i.id !== variantId),
      })),

      updateQuantity: (variantId, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter((i) => i.id !== variantId)
          : state.items.map((i) =>
              i.id === variantId ? { ...i, quantity: Math.min(quantity, i.stock_qty) } : i
            ),
      })),

      clearCart: () => set({ items: [], promoCode: null, discountAmount: 0 }),

      setPromoCode: (code, discount) => set({ promoCode: code, discountAmount: discount }),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'wilourin-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ─── WISHLIST STORE ──────────────────────────────────────

interface WishlistStore {
  items: WishlistProduct[]
  addItem: (product: WishlistProduct) => void
  removeItem: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => set((state) => {
        if (state.items.find((i) => i.id === product.id)) return state
        return { items: [...state.items, product] }
      }),

      removeItem: (productId) => set((state) => ({
        items: state.items.filter((i) => i.id !== productId),
      })),

      isWishlisted: (productId) => get().items.some((i) => i.id === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wilourin-wishlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ─── UI STORE ────────────────────────────────────────────

interface UIStore {
  isCartOpen: boolean
  isMenuOpen: boolean
  isSearchOpen: boolean
  isAdvisorOpen: boolean
  isHelpOpen: boolean
  toggleCart: () => void
  toggleMenu: () => void
  toggleSearch: () => void
  toggleAdvisor: () => void
  toggleHelp: () => void
  closeAll: () => void
  setCartOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isCartOpen: false,
  isMenuOpen: false,
  isSearchOpen: false,
  isAdvisorOpen: false,
  isHelpOpen: false,

  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen, isMenuOpen: false, isSearchOpen: false })),
  toggleMenu: () => set((s) => ({ isMenuOpen: !s.isMenuOpen, isCartOpen: false, isSearchOpen: false })),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen, isMenuOpen: false })),
  toggleAdvisor: () => set((s) => ({ isAdvisorOpen: !s.isAdvisorOpen })),
  toggleHelp: () => set((s) => ({ isHelpOpen: !s.isHelpOpen })),
  closeAll: () => set({ isCartOpen: false, isMenuOpen: false, isSearchOpen: false, isAdvisorOpen: false, isHelpOpen: false }),
  setCartOpen: (open) => set({ isCartOpen: open }),
}))

// ─── USER STORE ──────────────────────────────────────────

interface UserStore {
  profile: Profile | null
  isAdmin: boolean
  setProfile: (profile: Profile | null) => void
  setIsAdmin: (isAdmin: boolean) => void
  updateLoyaltyPoints: (points: number) => void
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  isAdmin: false,

  setProfile: (profile) => set({ profile }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  updateLoyaltyPoints: (points) =>
    set((state) => ({
      profile: state.profile
        ? {
            ...state.profile,
            loyalty_points: state.profile.loyalty_points + points,
            loyalty_tier:
              state.profile.loyalty_points + points >= 5000
                ? 'Gold'
                : state.profile.loyalty_points + points >= 1000
                ? 'Silver'
                : 'Bronze',
          }
        : null,
    })),
}))

// ─── RECENTLY VIEWED STORE ───────────────────────────────

interface RecentlyViewedItem {
  id: string
  name: string
  slug: string
  price: number
  image_url: string
  viewed_at: number
}

interface RecentlyViewedStore {
  items: RecentlyViewedItem[]
  addItem: (item: Omit<RecentlyViewedItem, 'viewed_at'>) => void
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) => set((state) => {
        const filtered = state.items.filter((i) => i.id !== item.id)
        const updated = [{ ...item, viewed_at: Date.now() }, ...filtered].slice(0, 6)
        return { items: updated }
      }),
    }),
    {
      name: 'wilourin-recently-viewed',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ─── TOAST STORE ─────────────────────────────────────────

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

// ─── AI ADVISOR STORE ────────────────────────────────────

interface AdvisorStore {
  messages: AdvisorMessage[]
  isLoading: boolean
  addMessage: (msg: AdvisorMessage) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
}

export const useAdvisorStore = create<AdvisorStore>((set) => ({
  messages: [],
  isLoading: false,

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
}))
