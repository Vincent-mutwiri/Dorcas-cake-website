'use client';

import { useState } from 'react';
import { useGetUsersQuery, useDeleteUserMutation, useGetOrdersQuery, useGetReviewsQuery } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, User, ShoppingBag, DollarSign, Star, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { data: users, isLoading, error } = useGetUsersQuery();
  const { data: orders } = useGetOrdersQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getUserStats = (userId) => {
    const userOrders = orders?.filter(order => order.user === userId) || [];
    const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    return {
      orderCount: userOrders.length,
      totalSpent,
      orders: userOrders
    };
  };

  const { data: allReviews } = useGetReviewsQuery();
  
  const getUserReviews = (userId) => {
    return allReviews?.filter(review => review.user?._id === userId) || [];
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const deleteHandler = async (id: string, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure?')) {
      try {
        await deleteUser(id).unwrap();
        toast({ title: 'Success', description: 'User deleted.' });
      } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete user.' });
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      {isLoading ? <LoadingSpinner /> : error ? <p className="text-destructive">Failed to load users.</p> : !users || users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl">No users found</p>
          <p className="text-muted-foreground mt-2">Registered users will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((user) => {
            const stats = getUserStats(user._id);
            return (
              <Card key={user._id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleUserClick(user)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {user.profilePicture && user.profilePicture !== '/images/default-avatar.png' ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.name} 
                          width={48} 
                          height={48} 
                          className="rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.isAdmin && <Badge>Admin</Badge>}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={(e) => deleteHandler(user._id, e)} 
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{stats.orderCount}</p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">KSh {stats.totalSpent.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {selectedUser.profilePicture && selectedUser.profilePicture !== '/images/default-avatar.png' ? (
                    <img 
                      src={selectedUser.profilePicture} 
                      alt={selectedUser.name} 
                      width={64} 
                      height={64} 
                      className="rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  {selectedUser.isAdmin && <Badge className="mt-1">Admin</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{getUserStats(selectedUser._id).orderCount}</p>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">KSh {getUserStats(selectedUser._id).totalSpent.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{getUserReviews(selectedUser._id).length}</p>
                        <p className="text-sm text-muted-foreground">Reviews Given</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Order History</h4>
                  {getUserStats(selectedUser._id).orders.length === 0 ? (
                    <p className="text-muted-foreground">No orders found</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {getUserStats(selectedUser._id).orders.map((order) => (
                        <Card key={order._id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Order #{order._id.substring(20, 24)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm">
                                  {order.orderItems?.length || 0} item(s)
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">KSh {order.totalPrice?.toFixed(2) || '0.00'}</p>
                                <Badge variant={order.isDelivered ? 'default' : 'secondary'}>
                                  {order.isDelivered ? 'Delivered' : 'Pending'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Reviews Given</h4>
                  {getUserReviews(selectedUser._id).length === 0 ? (
                    <p className="text-muted-foreground">No reviews found</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {getUserReviews(selectedUser._id).map((review) => (
                        <Card key={review._id}>
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <Badge variant={review.status === 'approved' ? 'default' : 'secondary'}>
                                  {review.status}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{review.product?.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {review.comment}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  variant="destructive" 
                  onClick={(e) => {
                    deleteHandler(selectedUser._id, e);
                    setIsModalOpen(false);
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}