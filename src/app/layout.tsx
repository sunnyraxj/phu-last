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
  title: 'Purbanchal Hasta Udyog | Authentic Handicrafts from North-East India',
  description: 'Discover and buy authentic, handcrafted items from the artisans of North-East India. Featuring unique products made from bamboo, jute, cane, and more.',
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
