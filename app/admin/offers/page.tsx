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
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Type for API error response
  interface ApiError {
    data?: {
      message?: string;
    };
    status?: number;
  }
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  interface SelectedVariant {
    weight: string;
    price: number;
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
    
    // Handle variant selection during edit
    if (offer.variantDisplay) {
      const variant = (offer.product as UIProduct).priceVariants?.find(
        (v) => v.weight === offer.variantDisplay
      );
      if (variant) {
        setSelectedVariant({
          weight: variant.weight,
          price: variant.price,
          discountedPrice: offer.discountedPrice
        });
        setValue('variantWeight', variant.weight, { shouldValidate: true });
        setValue('variantDisplay', offer.variantDisplay, { shouldValidate: true });
      }
    } else {
      // For base price offers, we still need to set price from the product
      setSelectedVariant({
        weight: '',
        price: offer.product.basePrice,
        discountedPrice: offer.discountedPrice
      });
      setValue('variantWeight', '', { shouldValidate: true });
      setValue('variantDisplay', '', { shouldValidate: true });
    }
    
    setValue('discountedPrice', offer.discountedPrice, { shouldValidate: true });
    setStartDate(new Date(offer.startDate));
    setEndDate(new Date(offer.endDate));
  };

  const handleCancel = () => {
    setEditingId(null);
    setSelectedProduct('');
    setSelectedVariant({
      weight: '',
      price: 0,
      discountedPrice: 0
    });
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
        price: variant.price,
        discountedPrice: variant.price * 0.9 // Default to 10% off
      };
      setSelectedVariant(newVariant);
      setValue('variantWeight', variant.weight, { shouldValidate: true });
      setValue('discountedPrice', newVariant.discountedPrice, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: IOfferInput) => {
    // Validate dates
    if (!startDate || !endDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select both start and end dates.',
      });
      return;
    }

    // Ensure start date is not in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (startDate < now) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Start date cannot be in the past.',
      });
      return;
    }

    // Validate end date is after start date
    if (endDate <= startDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'End date must be after start date.',
      });
      return;
    }

    // Validate variant and price
    if (!selectedVariant) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a variant and set a price.',
      });
      return;
    }
    
    // Validate discounted price
    const originalPrice = selectedVariant?.price || 0;
    if (selectedVariant.discountedPrice >= originalPrice) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Discounted price must be lower than the original price.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const offerData: IOfferInput = {
        ...data,
        startDate,
        endDate,
        isActive: true,
        discountedPrice: selectedVariant.discountedPrice,
        variantWeight: selectedVariant.weight,
        variantDisplay: selectedVariant.weight, // Use the same value for display
        product: selectedProduct
      };

      if (editingId) {
        await updateOffer({ id: editingId, data: offerData }).unwrap();
        toast({ title: 'Success', description: 'Offer updated successfully.' });
      } else {
        await createOffer(offerData).unwrap();
        toast({ title: 'Success', description: 'Offer created successfully.' });
      }

      // Reset form
      reset();
      setSelectedProduct('');
      setSelectedVariant(null);
      setStartDate(undefined);
      setEndDate(undefined);
      setEditingId(null);
      
      // Refresh offers list
      refetch();
    } catch (error: unknown) {
      console.error('Error saving offer:', error);
      const apiError = error as ApiError;
      const errorMessage = apiError?.data?.message || 'Failed to save offer. Please try again.';
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await deleteOffer(id).unwrap();
        toast({ title: 'Success', description: 'Offer deleted successfully.' });
        refetch();
      } catch (error) {
        console.error('Error deleting offer:', error);
        const apiError = error as ApiError;
        const errorMessage = apiError?.data?.message || 'Failed to delete offer. Please try again.';
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
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

  const getOriginalPrice = (offer: IAdminOffer) => {
    if (offer.variantDisplay) {
      const variant = offer.product.priceVariants?.find(
        (v: IPriceVariant) => v.weight === offer.variantDisplay
      );
      return variant ? variant.price : null;
    }
    return offer.product.basePrice;
  };

  const getDiscount = (offer: IAdminOffer) => {
    const originalPrice = getOriginalPrice(offer);
    if (originalPrice) {
      const discount = ((originalPrice - offer.discountedPrice) / originalPrice) * 100;
      return `${Math.round(discount)}% OFF`;
    }
    return 'N/A';
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Offers</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-6">
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
                                    min="0.01"
                                    max={selectedVariant?.price ? selectedVariant.price - 0.01 : ''}
                                    value={selectedVariant?.discountedPrice ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Allow empty string for better UX when clearing the field
                                      if (value === '') {
                                        const updatedVariant = {
                                          ...selectedVariant!,
                                          price: selectedVariant?.price || 0,
                                          discountedPrice: 0
                                        };
                                        setSelectedVariant(updatedVariant);
                                        setValue('discountedPrice', 0, { shouldValidate: true });
                                        return;
                                      }
                                      
                                      const price = parseFloat(value);
                                      if (!isNaN(price) && price > 0) {
                                        const updatedVariant = {
                                          ...selectedVariant!,
                                          discountedPrice: price
                                        };
                                        setSelectedVariant(updatedVariant);
                                        setValue('discountedPrice', price, { shouldValidate: true });
                                      }
                                    }}
                                    className="w-32 h-8 text-right border rounded-md px-2"
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Enter price"
                                    onBlur={(e) => {
                                      // Ensure the price is not empty on blur
                                      if (e.target.value === '') {
                                        const updatedVariant = {
                                          ...selectedVariant!,
                                          price: selectedVariant?.price || 0,
                                          discountedPrice: 0
                                        };
                                        setSelectedVariant(updatedVariant);
                                        setValue('discountedPrice', 0, { shouldValidate: true });
                                      }
                                    }}
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
                        onSelect={(date) => {
                          if (date) {
                            // If end date is before the new start date, reset it
                            if (endDate && date > endDate) {
                              setEndDate(undefined);
                            }
                            setStartDate(date);
                          }
                        }}
                        initialFocus
                        disabled={(date) => {
                          // Disable past dates
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
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
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // If start date is not selected, only disable past dates
                          if (!startDate) return date < today;
                          
                          // Otherwise, disable dates before start date
                          return date <= startDate;
                        }}
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
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setSelectedProduct('');
                    setSelectedVariant(null);
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setEditingId(null);
                  }}
                  disabled={isSubmitting}
                >
                  {editingId ? 'Cancel Edit' : 'Reset Form'}
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingId ? 'Update Offer' : 'Create Offer'}
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
                          {offer.variantDisplay ? (
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                              {offer.variantDisplay}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Base</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {(() => {
                              if (!offer.variantDisplay) return `${offer.product.basePrice.toFixed(2)} KSh`;
                              const variant = offer.product.priceVariants?.find((v: IPriceVariant) => v.weight === offer.variantDisplay);
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
                            {getDiscount(offer)}
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
