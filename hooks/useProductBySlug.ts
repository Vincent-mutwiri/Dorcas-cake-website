import { useGetProductBySlugQuery } from '@/store/services/api';
import { useToast } from '@/components/ui/use-toast';

export function useProductBySlug(slug: string) {
  const { toast } = useToast();
  const { data, isLoading, error } = useGetProductBySlugQuery(slug, {
    skip: !slug,
  });

  if (error) {
    console.error('Product fetch error:', error);
    toast({
      title: 'Error',
      description: 'Failed to load product details',
      variant: 'destructive',
    });
  }

  return { data, isLoading, error };
}
