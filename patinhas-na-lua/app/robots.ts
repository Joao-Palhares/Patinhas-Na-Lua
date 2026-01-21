import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://patinhasnalua.com'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/services'],
      disallow: ['/admin/', '/dashboard/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
