// User role types
export type UserRole = "Abu" | "Ijo" | "Ultra" | "Raden";

// User type with role
export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Session type with typed user
export interface SessionWithRole {
  user: UserWithRole;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
