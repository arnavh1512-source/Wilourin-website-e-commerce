export const METRO_CITIES = [
  'mumbai', 'delhi', 'new delhi', 'bangalore', 'bengaluru',
  'chennai', 'hyderabad', 'ahmedabad', 'kolkata', 'pune',
]

export function isMetroCity(city: string): boolean {
  return METRO_CITIES.includes(city.toLowerCase().trim())
}

export interface DeliveryEstimate {
  standard: string
  express: string
}

export function getDeliveryEstimate(city: string): DeliveryEstimate {
  return isMetroCity(city)
    ? { standard: '3–4 days', express: '1–2 days' }
    : { standard: '5–7 days', express: '2–3 days' }
}

export function getStoredCity(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('wilourin_city')
}

export function setStoredCity(city: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('wilourin_city', city)
}

export interface LocationResult {
  city: string
  state: string
  pincode: string
}

/** GPS-based: asks permission, fills address form fields */
export async function detectLocationByGPS(): Promise<LocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation not supported')
  }

  const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { timeout: 10000 }
    )
  })

  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
  )
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json() as {
    city?: string
    locality?: string
    principalSubdivision?: string
    postcode?: string
  }

  return {
    city: data.city || data.locality || '',
    state: data.principalSubdivision || '',
    pincode: data.postcode || '',
  }
}

/** IP-based: silent, no permission needed, just gets city name */
export async function detectCityByIP(): Promise<string> {
  const res = await fetch(
    'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en'
  )
  if (!res.ok) throw new Error('IP geolocation failed')
  const data = await res.json() as { city?: string; locality?: string }
  return data.city || data.locality || ''
}
