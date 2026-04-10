'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

export default function OrderSuccessPage() {
  const sp = useSearchParams()
  const orderNumber = sp.get('order')
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderNumber) return
    const supabase = createClient()
    supabase.from('orders').select('*').eq('order_number', orderNumber).single()
      .then(({ data }) => setOrder(data))
  }, [orderNumber])

  const deliveryDays = order?.shipping_method === 'Express' ? '2–3' : '5–7'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">
        {/* Animated check */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center animate-scale-in">
              <CheckCircle size={48} className="text-green-500" strokeWidth={1.5} />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-30" />
          </div>
        </div>

        <h1 className="font-serif text-4xl mb-3">Order Confirmed!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Thank you for shopping with Wilourin. Your order is being prepared.
        </p>

        {orderNumber && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order Number</span>
              <span className="font-semibold font-mono">{orderNumber}</span>
            </div>
            {order && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Paid</span>
                  <span className="font-semibold">₹{order.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>{order.shipping_method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estimated Delivery</span>
                  <span className="text-green-600 font-medium">{deliveryDays} business days</span>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mb-8">
          A confirmation email has been sent to your email address with full order details.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/account"
            className="flex-1 flex items-center justify-center gap-2 bg-[#0A0A0A] text-white py-3 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            <Package size={14} />
            Track Order
          </Link>
          <Link
            href="/products"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-[#0A0A0A] py-3 text-sm uppercase tracking-widest hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
