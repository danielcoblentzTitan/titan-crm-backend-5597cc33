import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UseAsyncQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: (string | number | boolean | undefined)[];
  queryFn: () => Promise<T>;
  errorMessage?: string;
  showErrorToast?: boolean;
}

export function useAsyncQuery<T>({
  queryKey,
  queryFn,
  errorMessage = 'An error occurred while fetching data',
  showErrorToast = true,
  ...options
}: UseAsyncQueryOptions<T>) {
  const { toast } = useToast();

  const result = useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });

  // Handle errors in a separate effect
  if (result.error && showErrorToast) {
    console.error('Query error:', result.error);
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }

  return result;
}