import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["cyrillic", "latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "M8 CRM",
    description: "Платформа управления лидами, офферами и командами.",
    icons: {
      icon: "/og.png",
      shortcut: "/og.png",
    },
    openGraph: {
      title: "M8 CRM",
      description: "Лиды. Офферы. Команды. Результат.",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "M8 CRM",
      description: "Лиды. Офферы. Команды. Результат.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${unbounded.variable}`}>
        {children}
      </body>
    </html>
  );
}
