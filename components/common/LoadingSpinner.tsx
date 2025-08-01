// components/common/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // The utility from shadcn

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <Loader2 className={cn('h-8 w-8 animate-spin text-primary', className)} />
  );
};

export default LoadingSpinner;