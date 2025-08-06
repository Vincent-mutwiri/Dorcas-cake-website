// components/layouts/Header.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User, LogOut, CakeSlice, UserPlus, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

const Header = () => {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const { items } = useSelector((state: RootState) => state.cart);
  const cartItemCount = items.reduce((acc, item) => acc + item.qty, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <CakeSlice className="h-6 w-6 text-primary" />
          <span className="font-bold">Dorcas Cake Shop</span>
        </Link>

        <nav className="flex flex-1 items-center space-x-4">
          <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            All Cakes
          </Link>
          <Link href="/categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Categories
          </Link>
          {session?.user?.isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-red-500 transition-colors hover:text-red-700">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          <Button asChild variant="ghost" className="relative gap-2">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
              {mounted && cartItemCount > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 flex items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90 p-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Link>
          </Button>

          {mounted && (
            session ? (
              <>
                <Button asChild variant="ghost" className="gap-2">
                  <Link href="/orders">
                    <User className="h-4 w-4" />
                    <span>Orders</span>
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => signOut()}
                  className="text-destructive hover:text-destructive/90 gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="gap-2">
                  <Link href="/auth/login">
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="gap-2">
                  <Link href="/auth/register">
                    <UserPlus className="h-5 w-5" />
                    <span>Register</span>
                  </Link>
                </Button>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;