'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Login form submitted', { email, redirect });
    
    // Basic validation
    if (!email || !password) {
      const errorMsg = 'Please fill in all fields';
      console.error('Validation error:', errorMsg);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: errorMsg,
      });
      return;
    }
    
    setIsLoading(true);
    console.log('Attempting to sign in...');

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl: redirect,
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        // More specific error messages based on the error
        let errorMessage = 'Invalid email or password';
        
        if (result.error.includes('CredentialsSignin')) {
          errorMessage = 'Invalid email or password';
        } else if (result.error.includes('user not found')) {
          errorMessage = 'No account found with this email';
        } else if (result.error.includes('password')) {
          errorMessage = 'Incorrect password';
        }
        
        console.error('Login failed:', { 
          error: result.error,
          message: errorMessage 
        });
        
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: errorMessage,
        });
      } else {
        // Login successful
        console.log('Login successful, redirecting to:', redirect);
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        
        // Use window.location.href for a full page reload to ensure all session data is loaded
        window.location.href = redirect;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An unexpected error occurred. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}