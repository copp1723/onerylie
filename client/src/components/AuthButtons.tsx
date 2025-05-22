import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';

export function AuthButtons() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.profileImageUrl && (
          <img 
            src={user.profileImageUrl} 
            alt="Profile" 
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <div className="text-sm">
          <p className="font-medium">{user.firstName || "User"}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/api/logout'}
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => window.location.href = '/api/login'}
    >
      Login
    </Button>
  );
}