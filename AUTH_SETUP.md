# Authentication Setup Complete ✅

## What's Been Implemented

### 1. Database Schema

✅ Created auth tables in PostgreSQL:

- **DI_user**: Stores user information with role field (Raden, Ultra, Ijo, Abu)
- **DI_session**: Manages user sessions
- **DI_account**: Stores authentication credentials (email/password)

✅ Added userId tracking to all data tables:

- DI_sale
- DI_leaf_purchase
- DI_internal_seed_sale
- DI_internal_leaf_purchase

✅ Created system admin user: `admin@system.local` with Raden role

### 2. Authentication System

✅ Installed better-auth (v1.3.27)
✅ Configured better-auth with:

- Drizzle adapter
- Email/password authentication
- No email verification (as requested)
- Auto sign-in enabled
- 7-day session expiration

✅ Created API routes at `/api/auth/[...all]`
✅ Created auth client for frontend use

### 3. UI Components

✅ Login page at `/login`
✅ Signup page at `/signup`
✅ Both pages use Shadcn UI components

## User Roles Defined

1. **Raden** (Admin)
   - Full access to everything
   - Can manage users
   - Can promote/demote roles

2. **Ultra** (Manager)
   - Access to everything except user promotion
   - Full CRUD on all data

3. **Ijo** (Limited User)
   - Can enter seed purchases/sales
   - Can only edit their own entries
   - View-only access to others' data

4. **Abu** (Read-only)
   - Read-only access to all data
   - Cannot create, edit, or delete

## Pricing Rules (To Be Implemented)

- Abu → Ijo: 100 per seed
- Ijo → Ultra/Raden: 200 per seed

## Next Steps Required

### 1. Environment Variable

Add to your `.env` file:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Test the Setup

1. Start the development server: `bun run dev`
2. Navigate to `/signup` to create your first user
3. New users default to "Abu" role
4. Use the system admin (admin@system.local) to promote users

### 3. Set Admin Password

You need to set a password for the system admin. Run this script:

```typescript
// scripts/set-admin-password.ts
import { Pool } from "pg";
import { hash } from "better-auth/utils/password";

const conn = new Pool({ connectionString: process.env.DATABASE_URL! });

async function setAdminPassword() {
  const password = "YourSecurePassword123!"; // Change this
  const hashedPassword = await hash(password);

  await conn.query(
    `
    INSERT INTO "DI_account" ("id", "account_id", "provider_id", "user_id", "password", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, 'admin@system.local', 'credential', 'system-admin', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
  `,
    [hashedPassword],
  );

  console.log("✅ Admin password set!");
  await conn.end();
}

setAdminPassword();
```

Run: `bun run scripts/set-admin-password.ts`

### 4. Implement Role-Based Access Control (RBAC)

#### A. Update tRPC Context with Auth

Modify `src/server/api/trpc.ts` to include user session:

```typescript
import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    db,
    session: session?.session ?? null,
    user: session?.user ?? null,
  };
};
```

#### B. Create Protected Procedures

Add to `src/server/api/trpc.ts`:

```typescript
// Middleware to require authentication
const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Middleware to require specific roles
const requireRole = (roles: string[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user || !roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

// Public procedure (anyone can call)
export const publicProcedure = t.procedure;

// Protected procedure (must be logged in)
export const protectedProcedure = t.procedure.use(requireAuth);

// Admin procedures
export const radenProcedure = t.procedure.use(requireRole(["Raden"]));
export const ultraProcedure = t.procedure.use(requireRole(["Raden", "Ultra"]));
export const ijoProcedure = t.procedure.use(
  requireRole(["Raden", "Ultra", "Ijo"]),
);
```

#### C. Update Routers with Auth

Example for `src/server/api/routers/sale.ts`:

```typescript
// Create sale - only Ijo, Ultra, Raden can create
create: ijoProcedure
  .input(
    z.object({
      groupId: z.number(),
      seedTypeId: z.number(),
      seedsSold: z.number(),
      // ... other fields
    })
  )
  .mutation(async ({ ctx, input }) => {
    // Calculate price based on user role
    const pricePerSeed = getPriceByRole(ctx.user.role);

    return ctx.db.insert(sales).values({
      ...input,
      pricePerSeed,
      totalPrice: input.seedsSold * pricePerSeed,
      userId: ctx.user.id, // Track who created this
    });
  }),

// Update - Ijo can only update their own
update: ijoProcedure
  .input(z.object({ id: z.number(), /* ... */ }))
  .mutation(async ({ ctx, input }) => {
    // Check if user owns this sale (for Ijo role)
    if (ctx.user.role === "Ijo") {
      const existing = await ctx.db.query.sales.findFirst({
        where: (sales, { and, eq }) =>
          and(eq(sales.id, input.id), eq(sales.userId, ctx.user.id)),
      });
      if (!existing) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
    }
    // Update...
  }),

// Delete - only Ultra and Raden
delete: ultraProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.delete(sales).where(eq(sales.id, input.id));
  }),

// List - filter by userId for Ijo role
getAll: protectedProcedure
  .input(z.object({ /* pagination */ }))
  .query(async ({ ctx, input }) => {
    let query = ctx.db.select().from(sales);

    // Ijo can only see their own sales
    if (ctx.user.role === "Ijo") {
      query = query.where(eq(sales.userId, ctx.user.id));
    }

    return query.limit(input.limit).offset(input.offset);
  }),
```

### 5. Implement Pricing Logic

Create `src/lib/pricing.ts`:

```typescript
export function getPriceBySellerRole(role: string): number {
  switch (role) {
    case "Abu":
      return 100; // Abu sells to Ijo at 100
    case "Ijo":
      return 200; // Ijo sells to Ultra/Raden at 200
    default:
      return 700; // Default price
  }
}
```

### 6. Add Route Protection

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return NextResponse.next();
  }

  // Protected routes
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 7. Update Home Page with Auth

Modify `src/app/page.tsx`:

```typescript
"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) return <div>Loading...</div>;

  if (!session) {
    router.push("/login");
    return null;
  }

  const { user } = session;

  // Show navigation based on role
  return (
    <main>
      <h1>Welcome, {user.name}!</h1>
      <p>Role: {user.role}</p>

      {/* Raden and Ultra can see everything */}
      {["Raden", "Ultra", "Ijo"].includes(user.role) && (
        <Link href="/sales-input">Enter Sales</Link>
      )}

      {["Raden", "Ultra"].includes(user.role) && (
        <Link href="/sales-data">View All Sales</Link>
      )}

      {user.role === "Raden" && (
        <Link href="/admin/users">Manage Users</Link>
      )}

      {/* Abu can only view data */}
      {user.role === "Abu" && (
        <p>You have read-only access</p>
      )}
    </main>
  );
}
```

### 8. Create User Management Page (Admin Only)

Create `src/app/admin/users/page.tsx` for Raden to manage users and assign roles.

## Files Created

### Core Auth Files

- `src/lib/auth.ts` - Server-side auth configuration
- `src/lib/auth-client.ts` - Client-side auth hooks
- `src/app/api/auth/[...all]/route.ts` - Auth API endpoints

### UI Pages

- `src/app/login/page.tsx` - Login form
- `src/app/signup/page.tsx` - Signup form

### Database

- `drizzle/0011_add_auth_tables.sql` - Migration file
- Updated `src/server/db/schema.ts` with auth tables

### Utility Scripts (in scripts/)

- `check-db-state.ts` - Check database state
- `add-user-columns.ts` - Applied userId columns
- `set-admin-password.ts` - Set admin password (to be created)

## Testing Checklist

- [ ] Start dev server: `bun run dev`
- [ ] Visit `/signup` and create a test user
- [ ] Login with the test user
- [ ] Verify session persists on page refresh
- [ ] Set admin password and login as admin
- [ ] Test role-based access (after implementing RBAC)
- [ ] Verify Ijo users can only edit their own data
- [ ] Verify Abu users have read-only access
- [ ] Test pricing logic for different roles

## Summary

✅ **Completed:**

1. Database schema with auth tables and userId tracking
2. better-auth configuration without email verification
3. Login and signup pages
4. API endpoints for authentication
5. System admin user created

🔄 **Remaining (In Order):**

1. Set admin password
2. Update tRPC context with session
3. Create protected procedures
4. Update all routers with auth and role checks
5. Implement dynamic pricing logic
6. Add route protection middleware
7. Update home page with role-based navigation
8. Create user management page for admins

The foundation is complete! You can now login, signup, and the database is tracking who creates what. The next phase is implementing the role-based permissions throughout your application.
