import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Munkidh - منقذ',
  description: 'Munkidh - Application de don de sang pour la Mauritanie avec support français et arabe',
  manifest: '/manifest.json',
  themeColor: '#ef4444',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}