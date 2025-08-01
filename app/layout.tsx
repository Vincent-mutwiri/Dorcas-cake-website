// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import { Toaster } from '@/components/ui/sonner'; // shadcn's toaster

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'C-Shopping - The Sweetest Cakes Online',
  description: 'Your one-stop shop for delicious, handcrafted cakes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}