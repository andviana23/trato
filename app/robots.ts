import { generateRobotsTxt } from './actions/sitemap';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/_next/', '/static/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://trato-de-barbados.com'}/sitemap.xml`,
  };
}

