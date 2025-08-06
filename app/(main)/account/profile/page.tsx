// app/(main)/account/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import { useUpdateUserProfileMutation } from '@/store/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Image from 'next/image';
import { Edit, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const { toast } = useToast();
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      defaultShippingAddress: {
        name: '',
        phoneNumber: '',
        streetName: '',
        town: '',
        city: '',
        houseName: '',
        houseNumber: '',
        country: 'Kenya',
      },
    },
  });
  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('/placeholder-product.jpg');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (session) {
      reset({
        name: session.user.name || '',
        defaultShippingAddress: {
          name: session.user.defaultShippingAddress?.name || '',
          phoneNumber: session.user.defaultShippingAddress?.phoneNumber || '',
          streetName: session.user.defaultShippingAddress?.streetName || '',
          town: session.user.defaultShippingAddress?.town || '',
          city: session.user.defaultShippingAddress?.city || '',
          houseName: session.user.defaultShippingAddress?.houseName || '',
          houseNumber: session.user.defaultShippingAddress?.houseNumber || '',
          country: session.user.defaultShippingAddress?.country || 'Kenya',
        },
      });
      // Use session image URL or fallback
      const sessionImageUrl = session.user.imageUrl && session.user.imageUrl !== '/images/default-avatar.png' 
        ? session.user.imageUrl 
        : 'https://via.placeholder.com/80x80/cccccc/666666?text=Admin';
      setImageUrl(sessionImageUrl);
    }
  }, [session, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl, publicUrl } = await res.json();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setImageUrl(publicUrl);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload Failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const result = await updateProfile({ ...data, imageUrl });
      if ('data' in result) {
        toast({ title: 'Success', description: 'Profile updated successfully.' });
        // Update session to reflect changes
        await update();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (session) {
      reset({
        name: session.user.name || '',
        defaultShippingAddress: {
          name: session.user.defaultShippingAddress?.name || '',
          phoneNumber: session.user.defaultShippingAddress?.phoneNumber || '',
          streetName: session.user.defaultShippingAddress?.streetName || '',
          town: session.user.defaultShippingAddress?.town || '',
          city: session.user.defaultShippingAddress?.city || '',
          houseName: session.user.defaultShippingAddress?.houseName || '',
          houseNumber: session.user.defaultShippingAddress?.houseNumber || '',
          country: session.user.defaultShippingAddress?.country || 'Kenya',
        },
      });
      // Reset to session image
      setImageUrl(session.user.imageUrl || '/placeholder-product.jpg');
    }
  };

  const handleSave = async (data: any) => {
    try {
      const payload = { ...data, imageUrl };
      const result = await updateProfile(payload);
      
      if ('data' in result) {
        toast({ title: 'Success', description: 'Profile updated successfully.' });
        setIsEditing(false);
        // Update session to reflect changes
        await update();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
    }
  };

  if (status === 'loading') return <LoadingSpinner />;

  const displayValue = (value: string | undefined | null) => value || 'N/A';

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSubmit(handleSave)} disabled={isUpdating || isUploading} className="gap-2">
              <Save className="h-4 w-4" />
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <img 
                src={session?.user?.imageUrl || 'https://via.placeholder.com/80x80/cccccc/666666?text=Admin'} 
                alt="Profile" 
                width={80} 
                height={80} 
                className="rounded-full object-cover" 
              />
              {isEditing && (
                <div>
                  <Label htmlFor="profileImage">Update Profile Image</Label>
                  <Input 
                    id="profileImage" 
                    type="file" 
                    onChange={handleImageUpload} 
                    disabled={isUploading} 
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                {isEditing ? (
                  <Controller 
                    name="name" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="mt-1" />} 
                  />
                ) : (
                  <p className="mt-1 text-sm">{displayValue(session?.user?.name)}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="mt-1 text-sm">{displayValue(session?.user?.email)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address Card */}
        <Card>
          <CardHeader>
            <CardTitle>Default Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                {isEditing ? (
                  <Controller 
                    name="defaultShippingAddress.name" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="mt-1" />} 
                  />
                ) : (
                  <p className="mt-1 text-sm">{displayValue(session?.user?.defaultShippingAddress?.name)}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                {isEditing ? (
                  <Controller 
                    name="defaultShippingAddress.phoneNumber" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="mt-1" />} 
                  />
                ) : (
                  <p className="mt-1 text-sm">{displayValue(session?.user?.defaultShippingAddress?.phoneNumber)}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Street Name</Label>
                {isEditing ? (
                  <Controller 
                    name="defaultShippingAddress.streetName" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="mt-1" />} 
                  />
                ) : (
                  <p className="mt-1 text-sm">{displayValue(session?.user?.defaultShippingAddress?.streetName)}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Town</Label>
                {isEditing ? (
                  <Controller 
                    name="defaultShippingAddress.town" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="mt-1" />} 
                  />
                ) : (
                  <p className="mt-1 text-sm">{displayValue(session?.user?.defaultShippingAddress?.town)}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">City</Label>
                {isEditing ? (
                  <Controller 
                    name="defaultShippingAddress.city" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="mt-1" />} 
                  />
                ) : (
                  <p className="mt-1 text-sm">{displayValue(session?.user?.defaultShippingAddress?.city)}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">House Name/Estate</Label>
                {isEditing ? (
                  <Controller 
                    name="defaultShippingAddress.houseName" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="mt-1" />} 
                  />
                ) : (
                  <p className="mt-1 text-sm">{displayValue(session?.user?.defaultShippingAddress?.houseName)}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">House Number</Label>
                {isEditing ? (
                  <Controller 
                    name="defaultShippingAddress.houseNumber" 
                    control={control} 
                    render={({ field }) => <Input {...field} className="mt-1" />} 
                  />
                ) : (
                  <p className="mt-1 text-sm">{displayValue(session?.user?.defaultShippingAddress?.houseNumber)}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Country</Label>
                <p className="mt-1 text-sm">{displayValue(session?.user?.defaultShippingAddress?.country || 'Kenya')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}