import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-gray-200 border-t-primary',
        sizeClasses[size],
        className
      )} 
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
