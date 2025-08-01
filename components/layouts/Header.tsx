// components/layouts/Header.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, CakeSlice } from 'lucide-react';

const Header = () => {
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
        </nav>

        {/* Action Icons */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Shopping Cart</span>
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">User Account</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;