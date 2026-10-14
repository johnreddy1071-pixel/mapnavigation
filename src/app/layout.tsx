import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Gravity - Annamacharya University Smart Campus Navigator',
  description: 'AI-Powered Smart Navigation & Geospatial Guide for Annamacharya University, Rajampet, Andhra Pradesh, India.',
  keywords: [
    'Annamacharya University',
    'AITS Rajampet',
    'Campus Navigation',
    'Smart Campus',
    'AI Gravity',
    'Rajampet',
    'Boyanapalli',
  ],
  authors: [{ name: 'Annamacharya University Geospatial Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1764f3',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
