import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Foshol - Smart Agriculture',
  description: 'An AI-Powered Smart Agriculture Platform for Bangladesh',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
