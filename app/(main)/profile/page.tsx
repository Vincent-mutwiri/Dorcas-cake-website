'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // In a real app, upload to cloud storage and get URL
      const fakeUrl = `/images/avatars/${file.name}`;
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePicture: fakeUrl }),
      });

      if (response.ok) {
        await update(); // Refresh session
        toast({ title: 'Success', description: 'Profile picture updated!' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  if (!session) return <div>Please login</div>;

  return (
    <div className="container py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Image
              src={session.user.image || '/images/default-avatar.png'}
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <Label htmlFor="avatar">Profile Picture</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
          </div>
          
          <div>
            <Label>Name</Label>
            <Input value={session.user.name || ''} disabled />
          </div>
          
          <div>
            <Label>Email</Label>
            <Input value={session.user.email || ''} disabled />
          </div>
          
          <div>
            <Label>Role</Label>
            <Input value={session.user.isAdmin ? 'Admin' : 'User'} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}