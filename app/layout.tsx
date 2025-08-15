import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Trato de Barbados",
  description: "Sistema",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
