import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Providers from '@/src/lib/chakra/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trato de Barbados – Sistema',
  description: 'ERP de barbearia',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers cookies={cookieHeader}>{children}</Providers>
      </body>
    </html>
  );
}


