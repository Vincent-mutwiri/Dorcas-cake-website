'use client';

import { useRouter } from 'next/navigation';
import { useGetOrdersQuery, useUpdateOrderMutation } from '@/store/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: orders, isLoading, error } = useGetOrdersQuery();
  const [updateOrder] = useUpdateOrderMutation();

  const updatePaymentStatus = async (orderId: string, isPaid: boolean) => {
    try {
      await updateOrder({ id: orderId, data: { isPaid } }).unwrap();
      toast({ title: 'Success', description: 'Payment status updated.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      {isLoading ? <LoadingSpinner /> : error ? <p className="text-destructive">Failed to load orders.</p> : !orders || orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl">No orders found</p>
          <p className="text-muted-foreground mt-2">Orders will appear here when customers make purchases</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order._id.substring(20, 24)}</TableCell>
                <TableCell>{(order.user as any)?.name || 'N/A'}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>KSh {order.totalPrice.toFixed(2)}</TableCell>
                <TableCell>
                  <select 
                    value={order.isPaid ? 'paid' : 'unpaid'}
                    onChange={(e) => updatePaymentStatus(order._id, e.target.value === 'paid')}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="unpaid">Not Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </TableCell>
                <TableCell>
                  {order.isDelivered ? <Badge>Delivered</Badge> : <Badge variant="secondary">Pending</Badge>}
                </TableCell>
                <TableCell>
                  <Button variant="outline" onClick={() => router.push(`/admin/orders/${order._id}`)}>
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}