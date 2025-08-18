'use server';

import { MetadataRoute } from 'next';

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trato-de-barbados.com';
  
  // Páginas estáticas principais
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/agenda`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fila`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/configuracoes`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/relatorios`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
  ];

  // Páginas dinâmicas baseadas em unidades (exemplo)
  const units = ['unidade-centro', 'unidade-vila', 'unidade-jardins'];
  const unitPages = units.map(unit => ({
    url: `${baseUrl}/unidade/${unit}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Páginas de serviços
  const services = ['corte', 'barba', 'corte-barba', 'design-sobrancelha', 'tratamentos'];
  const servicePages = services.map(service => ({
    url: `${baseUrl}/servico/${service}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Páginas de blog/artigos (se existirem)
  const blogPages = [
    {
      url: `${baseUrl}/blog/dicas-barbearia`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog/tendencias-2024`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [
    ...staticPages,
    ...unitPages,
    ...servicePages,
    ...blogPages,
  ];
}

export async function generateRobotsTxt(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trato-de-barbados.com';
  
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /agenda
Allow: /fila
Allow: /dashboard
Allow: /relatorios

# Crawl delay
Crawl-delay: 1`;
}

