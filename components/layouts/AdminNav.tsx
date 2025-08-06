'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Package, ShoppingCart, Users, FolderOpen, Star, Tag } from 'lucide-react';

const links = [
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { name: 'Offers', href: '/admin/offers', icon: Tag },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="grid items-start gap-2">
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            { 'bg-muted text-primary': pathname.startsWith(link.href) }
          )}
        >
          <link.icon className="h-4 w-4" />
          {link.name}
        </Link>
      ))}
    </nav>
  );
}