'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useCreateOrderMutation, useUpdateUserProfileMutation } from '@/store/services/api';
import { RootState } from '@/store/store';
import { clearCart } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const { items, shippingPrice, taxPrice, totalPrice, itemsPrice } =
    useSelector((state: RootState) => state.cart);

  const [createOrder, { isLoading, error }] = useCreateOrderMutation();
  const [updateProfile] = useUpdateUserProfileMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phoneNumber: '',
    streetName: '',
    town: '',
    city: '',
    houseName: '',
    houseNumber: '',
  });

  // Prefill address when session is available
  useEffect(() => {
    if (session?.user?.defaultShippingAddress) {
      const { defaultShippingAddress } = session.user;
      setShippingAddress({
        name: defaultShippingAddress.name || '',
        phoneNumber: defaultShippingAddress.phoneNumber || '',
        streetName: defaultShippingAddress.streetName || '',
        town: defaultShippingAddress.town || '',
        city: defaultShippingAddress.city || '',
        houseName: defaultShippingAddress.houseName || '',
        houseNumber: defaultShippingAddress.houseNumber || '',
      });
    }
  }, [session]);

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrderHandler = async () => {
    try {
      const orderItems = items.map((item) => ({
        name: item.name,
        qty: item.qty,
        image: item.images?.[0] || item.image || '',
        price: item.price,
        weight: item.selectedWeight || '1KG',
        product: item.id || item._id || '',
      }));

      const res = await createOrder({
        orderItems,
        shippingAddress: {
          name: shippingAddress.name,
          phoneNumber: shippingAddress.phoneNumber,
          address: `${shippingAddress.streetName}, ${shippingAddress.houseName ? shippingAddress.houseName + ', ' : ''}${shippingAddress.houseNumber ? 'House ' + shippingAddress.houseNumber + ', ' : ''}${shippingAddress.town}`,
          city: shippingAddress.city,
          state: shippingAddress.town, // Use town as state for Kenya
          postalCode: '00000', // Default postal code for Kenya
          country: 'Kenya',
        },
        paymentMethod: 'PayPal',
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      }).unwrap();

      dispatch(clearCart());
      toast({ title: 'Order Placed!', description: 'Thank you for your purchase.' });
      router.push(`/orders/${res._id}`);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: err.data?.message || 'An unexpected error occurred.',
      });
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-center text-4xl font-bold">Checkout</h1>
      <div className="grid gap-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Shipping Address</CardTitle>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      try {
                        setIsSaving(true);
                        await updateProfile({
                          defaultShippingAddress: shippingAddress
                        }).unwrap();
                        toast({
                          title: 'Success',
                          description: 'Shipping address updated successfully.',
                        });
                        setIsEditing(false);
                      } catch (error) {
                        toast({
                          variant: 'destructive',
                          title: 'Error',
                          description: 'Failed to update shipping address.',
                        });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      // Reset to original address
                      if (session?.user?.defaultShippingAddress) {
                        const { defaultShippingAddress } = session.user;
                        setShippingAddress({
                          name: defaultShippingAddress.name || '',
                          phoneNumber: defaultShippingAddress.phoneNumber || '',
                          streetName: defaultShippingAddress.streetName || '',
                          town: defaultShippingAddress.town || '',
                          city: defaultShippingAddress.city || '',
                          houseName: defaultShippingAddress.houseName || '',
                          houseNumber: defaultShippingAddress.houseNumber || '',
                        });
                      }
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={shippingAddress.name} 
                  onChange={handleInputChange} 
                  required 
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber" 
                  name="phoneNumber" 
                  value={shippingAddress.phoneNumber} 
                  onChange={handleInputChange} 
                  required 
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="streetName">Street Name</Label>
                <Input 
                  id="streetName" 
                  name="streetName" 
                  value={shippingAddress.streetName} 
                  onChange={handleInputChange} 
                  required 
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label htmlFor="town">Town</Label>
                <Input 
                  id="town" 
                  name="town" 
                  value={shippingAddress.town} 
                  onChange={handleInputChange} 
                  required 
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={shippingAddress.city} 
                  onChange={handleInputChange} 
                  required 
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label htmlFor="houseName">House Name/Estate (Optional)</Label>
                <Input 
                  id="houseName" 
                  name="houseName" 
                  value={shippingAddress.houseName} 
                  onChange={handleInputChange} 
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label htmlFor="houseNumber">House Number (Optional)</Label>
                <Input 
                  id="houseNumber" 
                  name="houseNumber" 
                  value={shippingAddress.houseNumber} 
                  onChange={handleInputChange} 
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>KSh {(itemsPrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>KSh {(shippingPrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>KSh {(taxPrice || 0).toFixed(2)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>KSh {(totalPrice || 0).toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={placeOrderHandler}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner className="h-5 w-5" /> : 'Place Order'}
              </Button>
              {error && (
                <p className="text-sm text-destructive text-center mt-2">
                  {(error as any).data?.message || 'Failed to place order.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}