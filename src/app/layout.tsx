import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { Header } from '@/components/shared/Header';

export const metadata: Metadata = {
  title: 'Purbanchal Hasta Udyog',
  description: 'Handicrafts from the East',
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
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
