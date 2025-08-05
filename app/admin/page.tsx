import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Users, FolderOpen } from 'lucide-react';

export default function AdminDashboardPage() {
  const adminCards = [
    {
      title: 'Products',
      description: 'Manage your product catalog',
      icon: Package,
      href: '/admin/products',
      color: 'bg-blue-500'
    },
    {
      title: 'Orders',
      description: 'View and manage customer orders',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'bg-green-500'
    },
    {
      title: 'Users',
      description: 'Manage user accounts',
      icon: Users,
      href: '/admin/users',
      color: 'bg-purple-500'
    },
    {
      title: 'Categories',
      description: 'Organize product categories',
      icon: FolderOpen,
      href: '/admin/categories',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the control panel.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full ${card.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}