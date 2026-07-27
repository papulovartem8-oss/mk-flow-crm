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
    title: "Платформа M&K",
    description: "Платформа управления лидами, офферами и командами.",
    icons: {
      icon: "/mk-logo-transparent.png",
      shortcut: "/mk-logo-transparent.png",
    },
    openGraph: {
      title: "Платформа M&K",
      description: "Лиды. Офферы. Команды. Результат.",
      images: [{ url: `${origin}/mk-logo-transparent.png`, width: 812, height: 610 }],
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Платформа M&K",
      description: "Лиды. Офферы. Команды. Результат.",
      images: [`${origin}/mk-logo-transparent.png`],
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
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className={`${manrope.variable} ${unbounded.variable}`}>
        {children}
      </body>
    </html>
  );
}
