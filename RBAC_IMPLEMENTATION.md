# Role-Based Access Control (RBAC) Implementation

## ✅ What's Been Implemented

### 1. tRPC Context with Authentication

**File: `src/server/api/trpc.ts`**

- Updated context to include user session from better-auth
- Context now provides:
  - `ctx.db` - Database instance
  - `ctx.session` - User session (null if not authenticated)
  - `ctx.user` - User object with role field (null if not authenticated)

### 2. Protected Procedures

Four types of procedures created:

#### `publicProcedure`

- Open to everyone (authenticated or not)
- Use for public data or login/signup endpoints

#### `protectedProcedure`

- Requires authentication
- Throws `UNAUTHORIZED` error if not logged in
- Guarantees `ctx.session` and `ctx.user` are not null

#### `ijoProcedure`

- Requires roles: Raden, Ultra, or Ijo
- Used for create/edit operations
- Throws `FORBIDDEN` error if user is Abu (read-only)

#### `ultraProcedure`

- Requires roles: Raden or Ultra
- Used for delete operations and management features
- Ijo and Abu users get `FORBIDDEN` error

#### `radenProcedure`

- Requires role: Raden only
- Used for admin-only operations (user management, promotions)
- Everyone else gets `FORBIDDEN` error

### 3. Helper Functions

**`canEditRecord(userRole, userId, recordUserId)`**

- Returns `true` if user can edit a specific record
- Raden/Ultra: Can edit any record
- Ijo: Can only edit their own records (userId === recordUserId)
- Abu: Cannot edit anything

**`canModifyData(userRole)`**

- Quick check if user role can create/edit data
- Returns `true` for Raden, Ultra, Ijo
- Returns `false` for Abu

### 4. Pricing Logic

**File: `src/lib/pricing.ts`**

Implemented dynamic pricing based on user roles:

```typescript
Abu → 100 per seed (sells to Ijo at lower price)
Ijo → 200 per seed (sells to Ultra/Raden)
Ultra/Raden → 700 per seed (standard market price)
```

Functions:

- `getSeedPriceByRole(role)` - Returns price per seed
- `getLeafPriceByRole(role)` - Returns price per leaf
- `calculateTotalPrice(quantity, pricePerUnit)` - Calculates total

### 5. Updated Sale Router

**File: `src/server/api/routers/sale.ts`**

Complete RBAC implementation:

#### Create Sales (`create`)

- **Permission**: `ijoProcedure` (Ijo and above)
- **Behavior**:
  - Automatically calculates price based on user role
  - Tracks `userId` to record who created the sale
  - Abu users cannot create sales

#### Get All Sales (`getAll`)

- **Permission**: `protectedProcedure` (must be logged in)
- **Behavior**:
  - Ijo users: Only see their own sales
  - Ultra/Raden: See all sales
  - Abu users: See all sales (read-only)
  - Returns pagination with `totalCount` and `pageCount`

#### Get Sales by Group (`getByGroupId`)

- **Permission**: `protectedProcedure`
- **Behavior**: Same filtering as `getAll`

#### Get Total Sold (`getTotalSold`)

- **Permission**: `protectedProcedure`
- **Behavior**:
  - Ijo: Only counts their own sales
  - Others: Counts all sales

#### Update Sale (`update`)

- **Permission**: `ijoProcedure` (Ijo and above)
- **Behavior**:
  - Checks if sale exists
  - Ijo: Can only update their own sales
  - Ultra/Raden: Can update any sale
  - Recalculates price based on current user role
  - Throws `FORBIDDEN` if Ijo tries to edit someone else's sale

#### Delete Sale (`delete`)

- **Permission**: `ultraProcedure` (Ultra and Raden only)
- **Behavior**:
  - Only Ultra and Raden can delete
  - Ijo and Abu get `FORBIDDEN` error

## Access Control Matrix

| Action         | Abu          | Ijo         | Ultra  | Raden  |
| -------------- | ------------ | ----------- | ------ | ------ |
| View all sales | ✅ Read-only | ✅ Own only | ✅ All | ✅ All |
| Create sale    | ❌           | ✅          | ✅     | ✅     |
| Edit own sale  | ❌           | ✅          | ✅     | ✅     |
| Edit any sale  | ❌           | ❌          | ✅     | ✅     |
| Delete sale    | ❌           | ❌          | ✅     | ✅     |
| Manage users   | ❌           | ❌          | ❌     | ✅     |

## Pricing Matrix

| Seller Role | Price per Seed | Buyer           |
| ----------- | -------------- | --------------- |
| Abu         | 100            | Ijo             |
| Ijo         | 200            | Ultra/Raden     |
| Ultra/Raden | 700            | Standard market |

## Next Steps

### 1. Update Remaining Routers

Apply the same RBAC pattern to:

#### Leaf Purchase Router

```typescript
// src/server/api/routers/leafPurchase.ts
- Use ijoProcedure for create
- Use protectedProcedure for queries with Ijo filtering
- Use ultraProcedure for delete
- Track userId in all creates
```

#### Internal Seed Sale Router

```typescript
// src/server/api/routers/internalSeed.ts
- Same RBAC as sale router
- Track userId
```

#### Internal Leaf Purchase Router

```typescript
// src/server/api/routers/internalLeaf.ts
- Same RBAC as leafPurchase router
- Track userId
```

#### Group/Member/SeedType/LeafType Routers

```typescript
- Use protectedProcedure for queries (all roles can view)
- Use ijoProcedure for create (Ijo and above)
- Use ultraProcedure for update/delete (Ultra and Raden)
```

### 2. Update Frontend Components

#### Sales Input Form

```typescript
// Remove manual price input fields
// Price is now auto-calculated based on logged-in user's role
// Show calculated price as read-only
```

#### Sales Data Table

```typescript
// Show/hide edit/delete buttons based on:
// - User role
// - Record ownership (for Ijo users)
// Use useSession() to get current user
```

#### Action Dialogs

```typescript
// Check permissions before showing edit/delete actions
// For Ijo: only show actions on own records
```

### 3. Create Middleware for Route Protection

**File: `src/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/login", "/signup"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const session = await auth.api.getSession({
    headers: request.headers,
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

### 4. Update Home Page

**File: `src/app/page.tsx`**

```typescript
"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push("/login");
    return null;
  }

  const { user } = session;

  return (
    <main>
      <h1>Welcome, {user.name}!</h1>
      <p>Role: {user.role}</p>

      {/* Role-based navigation */}
      {["Raden", "Ultra", "Ijo"].includes(user.role) && (
        <Link href="/sales-input">Enter Sales</Link>
      )}

      {user.role === "Raden" && (
        <Link href="/admin/users">Manage Users</Link>
      )}
    </main>
  );
}
```

### 5. Create User Management Page

**File: `src/app/admin/users/page.tsx`**

For Raden role to:

- View all users
- Promote/demote user roles
- Manage user accounts

### 6. Create User Router

**File: `src/server/api/routers/user.ts`**

```typescript
export const userRouter = createTRPCRouter({
  // Get all users - Raden only
  getAll: radenProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(users);
  }),

  // Update user role - Raden only
  updateRole: radenProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["Raden", "Ultra", "Ijo", "Abu"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
    }),
});
```

## Testing Checklist

- [ ] Login as different roles and verify RBAC
- [ ] Abu user cannot create/edit/delete (read-only)
- [ ] Ijo user can only see/edit their own sales
- [ ] Ijo user cannot delete sales
- [ ] Ultra user can edit/delete any sale
- [ ] Raden user has full access
- [ ] Prices are auto-calculated based on role
- [ ] Abu sells at 100, Ijo at 200, Ultra/Raden at 700
- [ ] Error messages appear for unauthorized actions
- [ ] Frontend shows/hides UI elements based on role

## Files Modified

### Core Files

- ✅ `src/server/api/trpc.ts` - Added auth context and protected procedures
- ✅ `src/lib/auth.ts` - Added role field to user type
- ✅ `src/lib/pricing.ts` - Created pricing logic
- ✅ `src/server/api/routers/sale.ts` - Full RBAC implementation

### Files to Update Next

- ⏳ `src/server/api/routers/leafPurchase.ts`
- ⏳ `src/server/api/routers/internalSeed.ts`
- ⏳ `src/server/api/routers/internalLeaf.ts`
- ⏳ `src/server/api/routers/group.ts`
- ⏳ `src/app/sales-input/page.tsx` - Remove manual price fields
- ⏳ `src/app/sales-data/sales-columns.tsx` - Add ownership checks
- ⏳ `src/app/sales-data/sale-actions.tsx` - Add permission checks
- ⏳ `src/middleware.ts` - Create route protection
- ⏳ `src/app/page.tsx` - Add role-based navigation

## Summary

✅ **Phase 1 Complete: Core RBAC Infrastructure**

- tRPC context with auth
- Protected procedures for all roles
- Pricing logic based on roles
- Sale router fully protected with RBAC

🔄 **Phase 2: Apply to All Routers**

- Update leaf purchase, internal sales routers
- Add userId tracking to all mutations

🔄 **Phase 3: Frontend Integration**

- Update forms to use auto-pricing
- Add permission checks to UI components
- Create route protection middleware

🔄 **Phase 4: Admin Features**

- User management page
- Role promotion/demotion
- User list and controls

The foundation is solid! The sale router demonstrates the complete pattern. Now we need to apply it to the remaining routers and update the frontend to respect these permissions.
