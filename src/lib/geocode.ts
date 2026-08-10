interface NominatimResult {
  address: {
    road?: string
    village?: string
    neighbourhood?: string
    hamlet?: string
    suburb?: string
    county?: string
    city?: string
    town?: string
    municipality?: string
    state?: string
    state_district?: string
    province?: string
    region?: string
    country?: string
  }
  display_name?: string
}

export interface ReverseGeocodeResult {
  address: string
  kelurahan: string
  kecamatan: string
  kabupaten: string
  provinsi: string
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PetaKoperasiDesa/1.0 (https://github.com/antsf/peta-koperasi)' },
    })

    if (!res.ok) return null

    const data: NominatimResult = await res.json()
    const a = data.address

    const road = a.road || a.neighbourhood || a.hamlet || ''
    const village = a.village || a.suburb || ''
    const kabupaten = a.county || a.state_district || a.municipality || a.city || a.town || ''
    const kecamatan = a.municipality || a.town || a.city || ''
    const provinsi = a.state || a.province || a.region || ''

    return {
      address: road,
      kelurahan: village,
      kecamatan,
      kabupaten,
      provinsi,
    }
  } catch {
    return null
  }
}
