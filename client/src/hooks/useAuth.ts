
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading: isLoading && !isError,
    isAuthenticated: !!user,
    isError
  };
}
