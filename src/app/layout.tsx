import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { Footer } from '@/components/shared/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  metadataBase: new URL('https://purbanchal-hasta-udyog.com'),
  title: 'Purbanchal Hasta Udyog | Authentic Indian Handicrafts',
  description: 'Shop for authentic handicraft items from North-East India at Purbanchal Hasta Udyog. Discover unique, handmade bamboo, jute, and cane crafts. Support local artisans and bring home a piece of Indian heritage.',
  keywords: ['handicraft items', 'indian handicrafts', 'purbanchal hasta udyog', 'bamboo crafts', 'jute products', 'handmade decor', 'north-east india crafts'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Purbanchal Hasta Udyog | Authentic Indian Handicrafts',
    description: 'Shop for authentic handicraft items from North-East India. Discover unique, handmade bamboo, jute, and cane crafts.',
    url: 'https://purbanchal-hasta-udyog.com',
    siteName: 'Purbanchal Hasta Udyog',
    images: [
      {
        url: '/og-image.png', // It's good practice to have an Open Graph image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Purbanchal Hasta Udyog | Authentic Indian Handicrafts',
    description: 'Shop for authentic handicraft items from North-East India. Discover unique, handmade bamboo, jute, and cane crafts.',
    // creator: '@yourtwitterhandle', // Add your Twitter handle here
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={cn('min-h-screen bg-background font-body antialiased flex flex-col', inter.variable)}>
        <FirebaseClientProvider>
          <ScrollProgress />
          <main className="flex-grow">{children}</main>
          <Footer />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
