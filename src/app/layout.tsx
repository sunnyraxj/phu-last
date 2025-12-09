import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

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
      <body className={cn('min-h-screen bg-background font-body antialiased', inter.variable)}>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
