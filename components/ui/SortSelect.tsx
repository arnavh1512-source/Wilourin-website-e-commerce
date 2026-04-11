'use client'

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

export function SortSelect({ value, buildHref }: { value: string; buildHref: (sort: string) => string }) {
  return (
    <select
      value={value}
      onChange={(e) => { window.location.href = buildHref(e.target.value) }}
      className="text-sm border border-gray-200 px-3 py-1.5 rounded outline-none"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
