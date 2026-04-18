'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, Clock } from 'lucide-react'
import { ProductCard } from '@/components/ui/ProductCard'
import { SkeletonGrid } from '@/components/ui/SkeletonCard'
import { debounce } from '@/lib/utils'

const TRENDING = ['Oversized Tee', 'Cargo Pants', 'Hoodies', 'Backpack', 'Dad Cap']

interface ProductResult {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  badge: string | null
  product_images: Array<{ image_url: string; is_primary: boolean }>
}

export default function SearchPage() {
  const sp = useSearchParams()
  const [query, setQuery] = useState(sp.get('q') ?? '')
  const [results, setResults] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('wilourin-recent-searches')
    if (stored) setRecent(JSON.parse(stored))
  }, [])

  const saveRecent = (q: string) => {
    const updated = [q, ...recent.filter((r) => r !== q)].slice(0, 5)
    setRecent(updated)
    localStorage.setItem('wilourin-recent-searches', JSON.stringify(updated))
  }

  const doSearch = useMemo(() => debounce(async (q: string) => {
      if (!q.trim()) { setResults([]); return }
      setLoading(true)
      try {
        const params = new URLSearchParams({ search: q })
        const res = await fetch(`/api/store/products?${params.toString()}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? (data as ProductResult[]) : [])
      } catch (err) {
        console.error('[Search] doSearch threw:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, 300), [])

  useEffect(() => {
    if (query) doSearch(query)
    else setResults([])
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      saveRecent(query.trim())
      doSearch(query)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 border-b-2 border-[#0A0A0A] pb-3 mb-10">
        <Search size={22} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products…"
          autoFocus
          className="flex-1 text-2xl font-serif outline-none placeholder-gray-300"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]) }} aria-label="Clear">
            <X size={18} className="text-gray-400 hover:text-black transition-colors" />
          </button>
        )}
      </form>

      {/* No query — show hints */}
      {!query && (
        <div className="space-y-8">
          {recent.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQuery(r)}
                    className="flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <Clock size={12} className="text-gray-400" />
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Trending Searches</h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((t) => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  className="border border-[#0A0A0A] text-sm px-4 py-1.5 rounded-full hover:bg-[#0A0A0A] hover:text-white transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {query && (
        <>
          {loading ? (
            <SkeletonGrid count={8} />
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif text-2xl mb-2">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-gray-500">Try a different term or browse our collections.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {results.map((p) => {
                  const primary = p.product_images.find((i) => i.is_primary) ?? p.product_images[0]
                  const secondary = p.product_images.find((i) => !i.is_primary)
                  return (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      slug={p.slug}
                      price={p.price}
                      original_price={p.original_price}
                      badge={p.badge}
                      primaryImage={primary?.image_url ?? ''}
                      secondaryImage={secondary?.image_url}
                    />
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
