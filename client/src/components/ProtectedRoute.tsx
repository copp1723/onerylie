
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && user?.role !== 'admin')) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
            <CardDescription>
              {!isAuthenticated 
                ? 'You need to be logged in to access this area.'
                : 'You need administrator access for this area.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              This area contains tools for testing and developing AI prompts.
              Please log in with appropriate credentials to continue.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
            >
              {isAuthenticated ? 'Switch Account' : 'Log In Now'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
