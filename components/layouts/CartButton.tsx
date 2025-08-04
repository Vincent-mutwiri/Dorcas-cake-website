'use client';

import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useEffect, useState } from 'react';

const CartButton = () => {
  const [mounted, setMounted] = useState(false);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link href="/cart" className="relative">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {mounted && cartCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs p-1"
          >
            {cartCount}
          </Badge>
        )}
        <span className="sr-only">Shopping Cart</span>
      </Button>
    </Link>
  );
};

export default CartButton;
