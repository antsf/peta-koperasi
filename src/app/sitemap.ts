import type { MetadataRoute } from 'next'
import { createAnonServerClient } from '@/lib/supabase/server'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://peta-koperasi.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAnonServerClient()

  const { data } = await supabase
    .from('koperasi_points')
    .select('id, created_at')
    .eq('status', 'approved')

  const pointPages: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
    url: `${BASE}/point/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at).toISOString() : undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: BASE, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${BASE}/submit`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...pointPages,
  ]
}