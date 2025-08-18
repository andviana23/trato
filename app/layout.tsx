import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNavigation } from '@/components/layout/MobileNavigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Trato de Barbados - Sistema de Gestão para Barbearias',
    template: '%s | Trato de Barbados'
  },
  description: 'Sistema completo de gestão para barbearias com agendamentos, fila de atendimento, dashboard analítico e relatórios financeiros.',
  keywords: ['barbearia', 'gestão', 'agendamentos', 'fila', 'dashboard', 'relatórios', 'barbearia digital'],
  authors: [{ name: 'Trato de Barbados Team' }],
  creator: 'Trato de Barbados',
  publisher: 'Trato de Barbados',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://trato-de-barbados.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://trato-de-barbados.com',
    title: 'Trato de Barbados - Sistema de Gestão para Barbearias',
    description: 'Sistema completo de gestão para barbearias com agendamentos, fila de atendimento, dashboard analítico e relatórios financeiros.',
    siteName: 'Trato de Barbados',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Trato de Barbados - Sistema de Gestão',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trato de Barbados - Sistema de Gestão para Barbearias',
    description: 'Sistema completo de gestão para barbearias com agendamentos, fila de atendimento, dashboard analítico e relatórios financeiros.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Dados estruturados para organização */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Trato de Barbados',
              description: 'Sistema de gestão para barbearias',
              url: 'https://trato-de-barbados.com',
              logo: 'https://trato-de-barbados.com/logo.png',
              sameAs: [
                'https://facebook.com/tratodebarbados',
                'https://instagram.com/tratodebarbados',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+55-11-99999-9999',
                contactType: 'customer service',
                areaServed: 'BR',
                availableLanguage: 'Portuguese',
              },
            }),
          }}
        />
        
        {/* Preconnect para recursos externos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        
        {/* Preload de recursos críticos */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* Meta tags para PWA */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Trato de Barbados" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <BottomNavigation />
          </div>
        </Providers>
      </body>
    </html>
  );
}
