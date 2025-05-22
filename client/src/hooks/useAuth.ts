import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading: isLoading && !isError,
    isAuthenticated: !!user,
    isError
  };
}