// components/layouts/Header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, CakeSlice, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import CartButton from '@/components/layouts/CartButton';

const Header = () => {
  const { data: session } = useSession();

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <CakeSlice className="h-6 w-6 text-primary" />
          <span className="font-bold">Dorcas Cake Shop</span>
        </Link>

        {/* Main Navigation */}
        <nav className="flex flex-1 items-center space-x-4">
          <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            All Cakes
          </Link>
          <Link href="/categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Categories
          </Link>
          {session?.user?.isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Admin
            </Link>
          )}
        </nav>

        {/* Action Icons */}
        <div className="flex items-center space-x-4">
          <CartButton />
          {session ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm">{session.user?.name}</span>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/auth/login">
                <User className="h-5 w-5 mr-2" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;