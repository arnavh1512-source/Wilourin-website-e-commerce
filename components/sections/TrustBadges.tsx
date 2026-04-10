import { Lock, RefreshCw, Truck, ShieldCheck } from 'lucide-react'

const BADGES = [
  { icon: <Lock size={20} />, label: 'Secure Payment', sub: 'UPI, Cards, Paytm' },
  { icon: <RefreshCw size={20} />, label: 'Easy Returns', sub: '7-day return policy' },
  { icon: <Truck size={20} />, label: 'Free Shipping', sub: 'On orders above ₹999' },
  { icon: <ShieldCheck size={20} />, label: 'Authentic Products', sub: '100% genuine pieces' },
]

export function TrustBadges() {
  return (
    <section className="py-12 border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {BADGES.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center text-center gap-2 py-4">
              <div className="text-[#0A0A0A]">{badge.icon}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider">{badge.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{badge.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
