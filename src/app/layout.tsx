import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { Header } from '@/components/shared/Header';

export const metadata: Metadata = {
  title: 'New App',
  description: 'Built with Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        <Header />
        <main className="container py-8">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
