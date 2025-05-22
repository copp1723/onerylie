import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AuthButtons() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  if (user) {
    // Get the first letter of name for avatar fallback
    const fallbackInitial = user.firstName ? 
      user.firstName.charAt(0).toUpperCase() : 
      user.email ? 
        user.email.charAt(0).toUpperCase() : 
        'U';

    return (
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          {user.profileImageUrl && (
            <AvatarImage 
              src={user.profileImageUrl} 
              alt="Profile" 
            />
          )}
          <AvatarFallback>{fallbackInitial}</AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="font-medium">{user.firstName || "User"}</p>
          <p className="text-xs text-muted-foreground">{user.email || ""}</p>
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