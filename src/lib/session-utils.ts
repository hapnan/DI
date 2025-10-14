import type { UserRole } from "~/types/auth";

// Type guard to check if a value is a valid UserRole
export function isValidUserRole(role: unknown): role is UserRole {
  return (
    typeof role === "string" &&
    (role === "Abu" || role === "Ijo" || role === "Ultra" || role === "Raden")
  );
}

// Safely get user role from session with fallback
export function getUserRole(session: unknown): UserRole {
  if (
    session &&
    typeof session === "object" &&
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "role" in session.user
  ) {
    const role = (session.user as { role: unknown }).role;
    if (isValidUserRole(role)) {
      return role;
    }
  }
  return "Abu"; // Default to read-only
}

// Safely get user name from session
export function getUserName(session: unknown): string {
  if (
    session &&
    typeof session === "object" &&
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "name" in session.user &&
    typeof (session.user as { name: unknown }).name === "string"
  ) {
    return (session.user as { name: string }).name;
  }
  return "User";
}

// Safely get user ID from session
export function getUserId(session: unknown): string | undefined {
  if (
    session &&
    typeof session === "object" &&
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof (session.user as { id: unknown }).id === "string"
  ) {
    return (session.user as { id: string }).id;
  }
  return undefined;
}
