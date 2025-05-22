import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AuthButtons } from './AuthButtons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              You need to be logged in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AuthButtons />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}