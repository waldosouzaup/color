import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mestre da Colorimetria",
  description:
    "Observe, corrija e registre. Colorimetria automotiva com rastreabilidade.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.ico",
  },
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('mestre-color-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* O proxy emite um nonce por requisição; sem ele o CSP strict-dynamic bloqueia este script. */
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

