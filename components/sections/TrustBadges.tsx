import { Lock, RefreshCw, Truck, ShieldCheck } from 'lucide-react'

const BADGES = [
  { icon: Lock, label: 'Secure Payment', sub: 'UPI, Cards, Paytm' },
  { icon: RefreshCw, label: 'Easy Returns', sub: '7-day return policy' },
  { icon: Truck, label: 'Free Shipping', sub: 'On orders above ₹999' },
  { icon: ShieldCheck, label: 'Authentic Products', sub: '100% genuine pieces' },
]

export function TrustBadges() {
  return (
    <section className="py-10 bg-w-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {BADGES.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center text-center gap-2 py-4">
              <div className="text-w-forest"><badge.icon size={20} /></div>
              <div>
                <p className="font-sans text-xs font-medium uppercase tracking-widest text-white">{badge.label}</p>
                <p className="font-sans text-xs text-white/50 mt-0.5">{badge.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
