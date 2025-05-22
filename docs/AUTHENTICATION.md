# Authentication System Documentation

## Overview

Rylie AI uses Replit Auth for secure, OAuth 2.0-based authentication. This provides a robust authentication mechanism for internal staff to access the platform and manage dealership personas, inventory, and conversation settings.

## Authentication Flow

1. **User Login**:
   - Users click the "Login" button in the application header
   - They are redirected to Replit's OAuth login page
   - After successful authentication, they are redirected back to the application

2. **Session Management**:
   - After authentication, a secure session is created in the database
   - The session contains user claims and tokens from Replit
   - Sessions expire after one week or on logout

3. **Access Control**:
   - Protected routes require authentication
   - Role-based access control determines what features users can access
   - Admin users have full access to all features

## Backend Implementation

### Middleware

The system includes several authentication middleware functions:

- `isAuthenticated`: Ensures the user is logged in
- `isAdmin`: Ensures the user has admin privileges 
- `apiKeyAuth`: For API-based authentication using API keys

### Session Storage

Sessions are stored securely in the PostgreSQL database using `connect-pg-simple`. This provides:

- Persistent sessions that survive server restarts
- Session expiration and cleanup
- Protection against session hijacking

### User Management

User information is stored in the `users` table:

```typescript
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("user"),
  dealershipId: integer("dealership_id").references(() => dealerships.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

The system automatically creates or updates user records based on information from Replit Auth.

## Frontend Implementation

### Authentication Hook

The `useAuth` hook provides authentication state to components:

```typescript
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
```

### Protected Routes

Secure routes check authentication status before rendering:

```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return children;
}
```

### Auth UI Components

The `AuthButtons` component displays login/logout buttons based on authentication state:

```tsx
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
```

## API Authentication

For API endpoints, the system uses two authentication mechanisms:

1. **Session-based Authentication**:
   - For internal staff using the web interface
   - Protected by `isAuthenticated` middleware

2. **API Key Authentication**:
   - For external systems integrating with Rylie AI
   - Protected by `apiKeyAuth` middleware
   - Each dealership can have multiple API keys

## Setup Requirements

To set up Replit Auth, the following environment variables are required:

- `SESSION_SECRET`: A secure secret for signing session cookies
- `REPLIT_DOMAINS`: Comma-separated list of allowed domains
- `REPL_ID`: The ID of the Replit application (automatically provided)
- `DATABASE_URL`: PostgreSQL connection string for session storage

## Security Considerations

- Sessions are stored in the database rather than memory for better security and persistence
- All authentication routes use HTTPS to protect sensitive data
- Tokens are never exposed to the client-side JavaScript
- Session cookies are HttpOnly to prevent XSS attacks
- Regular session cleanup prevents database bloat

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**:
   - Check that you're logged in
   - Verify that session database is properly set up
   - Ensure the `sessions` table exists in the database

2. **Session Not Persisting**:
   - Verify `SESSION_SECRET` is consistent
   - Check database connection is stable
   - Ensure cookies are not being blocked

3. **Access Denied to Resources**:
   - Verify user has the correct role assigned
   - Check if the user is assigned to the correct dealership
   - Review permission requirements for the specific resource

### Debugging

To debug authentication issues:

1. Check server logs for authentication errors
2. Verify the session data in the database
3. Check network requests for authentication API calls
4. Inspect cookies to ensure session cookie is present