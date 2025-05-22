import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AuthButtons } from './AuthButtons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isError } = useAuth();

  // Show a brief loading state only for initial load
  if (isLoading && !isError) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated (either due to error or no user), show the login card
  if (!isAuthenticated) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              You need to be logged in to access this prompt testing page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              This area contains tools for testing and developing Rylie AI prompts. 
              Please log in with your credentials to continue.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Log In Now
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If authenticated, show the protected content
  return <>{children}</>;
}