'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { useGetProductsQuery, useCreateOfferMutation, useGetAdminOffersQuery, useUpdateOfferMutation, useDeleteOfferMutation } from '@/store/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IAdminOffer, IOfferInput, IPriceVariant } from '@/types/offer';
import { UIProduct } from '@/types/product';

export default function AdminOffersPage() {
  const { toast } = useToast();
  const { data: products } = useGetProductsQuery();
  const { data: offers, isLoading, refetch } = useGetAdminOffersQuery();
  const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOffer] = useDeleteOfferMutation();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  interface SelectedVariant {
    weight: string;
    discountedPrice: number;
  }

  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);
  
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<IOfferInput>();
  
  // Watch for product changes to update variants
  const watchProduct = watch('product');
  
  // Get the selected product's variants
  const selectedProductData = products?.find((p) => p._id === watchProduct) as UIProduct | undefined;
  const variants = selectedProductData?.priceVariants || [];

  const handleEdit = (offer: IAdminOffer) => {
    setEditingId(offer._id);
    setValue('product', offer.product._id);
    setSelectedProduct(offer.product._id);
    
    const product = offer.product as UIProduct;
    if (offer.variantWeight) {
      const variant = product.priceVariants?.find((v) => v.weight === offer.variantWeight);
      if (variant) {
        setSelectedVariant({
          weight: variant.weight,
          discountedPrice: offer.discountedPrice
        });
      } else {
        setSelectedVariant(null);
      }
      setValue('variantWeight', offer.variantWeight, { shouldValidate: true });
    } else {
      setSelectedVariant(null);
      setValue('variantWeight', '', { shouldValidate: true });
    }
    
    setValue('discountedPrice', offer.discountedPrice, { shouldValidate: true });
    setStartDate(new Date(offer.startDate));
    setEndDate(new Date(offer.endDate));
  };

  const handleCancel = () => {
    setEditingId(null);
    setSelectedProduct('');
    setSelectedVariant(null);
    reset({
      product: '',
      variantWeight: '',
      discountedPrice: 0,
      startDate: undefined,
      endDate: undefined,
      isActive: true
    });
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  const handleVariantSelect = (variant: IPriceVariant) => {
    // Only update if we're selecting a different variant
    if (selectedVariant?.weight !== variant.weight) {
      const newVariant = {
        weight: variant.weight,
        discountedPrice: variant.price * 0.9 // Default to 10% off
      };
      setSelectedVariant(newVariant);
      setValue('variantWeight', variant.weight, { shouldValidate: true });
      setValue('discountedPrice', newVariant.discountedPrice, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: IOfferInput) => {
    if (!startDate || !endDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select both start and end dates.',
      });
      return;
    }

    if (!selectedVariant) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a variant and set a price.',
      });
      return;
    }

    try {
      const offerData = {
        ...data,
        startDate,
        endDate,
        isActive: true,
        discountedPrice: selectedVariant.discountedPrice,
        variantWeight: selectedVariant.weight
      };

      if (editingId) {
        await updateOffer({ id: editingId, data: offerData }).unwrap();
        toast({ title: 'Success', description: 'Offer updated successfully.' });
      } else {
        await createOffer(offerData).unwrap();
        toast({ title: 'Success', description: 'Offer created successfully.' });
      }
      
      reset();
      setStartDate(undefined);
      setEndDate(undefined);
      setEditingId(null);
      refetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.data?.message || 'An error occurred while saving the offer.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await deleteOffer(id).unwrap();
        toast({ title: 'Success', description: 'Offer deleted successfully.' });
        refetch();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete offer.',
        });
      }
    }
  };

  const isOfferActive = (offer: IAdminOffer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    return offer.isActive && now >= start && now <= end;
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Offers</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-6">
              {editingId ? 'Edit Offer' : 'Create New Offer'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <Select
                  onValueChange={(value) => {
                    setValue('product', value);
                    setSelectedProduct(value);
                    setSelectedVariant(null);
                    setValue('variantWeight', '');
                    setValue('discountedPrice', 0);
                  }}
                  value={selectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.product && (
                  <p className="text-sm text-destructive mt-1">Product is required</p>
                )}
              </div>

              {variants.length > 0 ? (
                <div>
                  <Label>Select Variant</Label>
                  <div className="space-y-2 mt-2">
                    {variants.map((variant) => {
                      const isSelected = selectedVariant?.weight === variant.weight;
                      return (
                        <div 
                          key={variant.weight}
                          onClick={() => {
                            // Only call handleVariantSelect if this variant is not already selected
                            if (selectedVariant?.weight !== variant.weight) {
                              handleVariantSelect(variant);
                            }
                          }}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/10' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{variant.weight}</span>
                            <div className="text-right">
                              <div className="line-through text-muted-foreground text-sm">
                                KSh {variant.price.toFixed(2)}
                              </div>
                              {isSelected ? (
                                <div className="font-medium text-primary">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedVariant?.discountedPrice ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Allow empty string for better UX when clearing the field
                                      if (value === '') {
                                        const updatedVariant = {
                                          ...selectedVariant!,
                                          discountedPrice: 0
                                        };
                                        setSelectedVariant(updatedVariant);
                                        setValue('discountedPrice', 0, { shouldValidate: true });
                                        return;
                                      }
                                      
                                      const price = parseFloat(value);
                                      if (!isNaN(price) && price >= 0) {
                                        const updatedVariant = {
                                          ...selectedVariant!,
                                          discountedPrice: price
                                        };
                                        setSelectedVariant(updatedVariant);
                                        setValue('discountedPrice', price, { shouldValidate: true });
                                      }
                                    }}
                                    className="w-32 h-8 text-right"
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Enter price"
                                  />
                                </div>
                              ) : (
                                <div className="h-8 flex items-center justify-end">
                                  <span className="text-muted-foreground text-sm">Click to select</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <input type="hidden" {...register('variantWeight', { required: 'Please select a variant' })} />
                  {errors.variantWeight && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.variantWeight.message as string}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="discountedPrice">Discounted Price (Ksh)</Label>
                  <Input
                    id="discountedPrice"
                    type="number"
                    step="0.01"
                    {...register('discountedPrice', { required: true, min: 0.01 })}
                  />
                  {errors.discountedPrice && (
                    <p className="text-sm text-destructive mt-1">
                      Please enter a valid price
                    </p>
                  )}
                </div>
              )}

              <input type="hidden" {...register('variantWeight', { required: 'Please select a variant' })} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => setEndDate(date)}
                        initialFocus
                        disabled={(date) =>
                          startDate ? date < startDate : date < new Date()
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isCreating || isUpdating}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? (
                    'Saving...'
                  ) : editingId ? (
                    'Update Offer'
                  ) : (
                    'Create Offer'
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-6">Active Offers</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : offers && offers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Original Price</TableHead>
                      <TableHead>Discounted Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer._id}>
                        <TableCell className="font-medium">
                          {offer.product.name}
                        </TableCell>
                        <TableCell>
                          {offer.variantWeight ? (
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                              {offer.variantWeight}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Base</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {(() => {
                              if (!offer.variantWeight) return `${offer.product.basePrice.toFixed(2)} KSh`;
                              const variant = offer.product.priceVariants?.find((v: IPriceVariant) => v.weight === offer.variantWeight);
                              return variant ? `${variant.price.toFixed(2)} KSh` : 'N/A';
                            })()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {offer.discountedPrice.toFixed(2)} KSh
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(() => {
                              if (offer.variantWeight) {
                                const variant = offer.product.priceVariants?.find((v: IPriceVariant) => v.weight === offer.variantWeight);
                                if (!variant) return 'N/A';
                                const discount = ((variant.price - offer.discountedPrice) / variant.price) * 100;
                                return `${Math.round(discount)}% OFF`;
                              } else {
                                const discount = ((offer.product.basePrice - offer.discountedPrice) / offer.product.basePrice) * 100;
                                return `${Math.round(discount)}% OFF`;
                              }
                            })()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isOfferActive(offer) ? 'default' : 'secondary'}
                            className={isOfferActive(offer) ? 'bg-green-500' : ''}
                          >
                            {isOfferActive(offer) ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            <div>{format(new Date(offer.startDate), 'MMM d, yyyy')}</div>
                            <div className="text-xs">to</div>
                            <div>{format(new Date(offer.endDate), 'MMM d, yyyy')}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(offer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(offer._id)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No offers found. Create your first offer to get started.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Offer Guidelines</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Each product can only have one active offer at a time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Offers will automatically activate and deactivate based on the date range.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Double check dates to avoid overlapping offers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>You can manually disable an offer if needed.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
