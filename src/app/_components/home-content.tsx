"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useSession } from "~/lib/auth-client";
import { SectionLoading } from "~/components/ui/loading";
import { getUserRole, getUserName } from "~/lib/session-utils";
import type { UserRole } from "~/types/auth";

const roleColors: Record<UserRole, string> = {
  Raden: "bg-purple-500 text-white",
  Ultra: "bg-blue-500 text-white",
  Ijo: "bg-green-500 text-white",
  Abu: "bg-gray-500 text-white",
};

export function HomeContent() {
  const { data: session, isPending } = useSession();
  const userRole = getUserRole(session);
  const userName = getUserName(session);

  if (isPending) {
    return <SectionLoading />;
  }

  // Define which cards each role can see
  const canCreate = userRole !== "Abu"; // Ijo, Ultra, Raden can create
  const canManageSetup = userRole === "Ultra" || userRole === "Raden"; // Ultra and Raden
  const canManageUsers = userRole === "Raden"; // Only Raden

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header with Role Badge */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-200">
              Seed Sales & Leaf Purchase Tracker
            </h1>
          </div>
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="text-lg text-gray-600 dark:text-gray-400">
              Welcome, {userName}
            </span>
            <Badge className={roleColors[userRole]}>{userRole}</Badge>
          </div>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
            Track and manage your seed sales and leaf purchases efficiently with
            our simple, powerful interface.
          </p>
        </div>

        {/* Action Cards - Role-Based */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* View Data - Everyone can view */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                View All Data
              </CardTitle>
              <CardDescription>
                Browse and analyze all your seed sales and leaf purchase
                records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sales-data">View All Data</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Setup Cards - Ultra and Raden only */}
          {canManageSetup && (
            <>
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    Setup Anggota
                  </CardTitle>
                  <CardDescription>
                    Add and manage group members for tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/setup-members">Setup Members</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    Setup Kelompok
                  </CardTitle>
                  <CardDescription>
                    Create seed groups before recording sales data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/setup">Setup Groups</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* User Management - Raden only */}
          {canManageUsers && (
            <>
              <Card className="border-purple-200 bg-gradient-to-b from-gray-50 to-gray-100 transition-shadow hover:shadow-lg dark:border-purple-800 dark:bg-purple-950 dark:from-gray-900 dark:to-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage user roles and permissions (Admin only).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Link href="/admin/users">Manage Users</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-purple-200 bg-gradient-to-b from-gray-50 to-gray-100 transition-shadow hover:shadow-lg dark:border-purple-800 dark:bg-purple-950 dark:from-gray-900 dark:to-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    Price Management
                  </CardTitle>
                  <CardDescription>
                    Manage pricing for groups and internal roles (Admin only).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Link href="/price-management">Manage Users</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Create Cards - Ijo, Ultra, Raden */}
          {canCreate && (
            <>
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    Penjualan Bibit Internal
                  </CardTitle>
                  <CardDescription>
                    Form for recording internal seed sales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/seed-sales-input">Record Seed Sales</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    Penjualan Bibit Kelompok
                  </CardTitle>
                  <CardDescription>
                    Form for recording group seed sales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/sales-input">Input Form</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🍃</span>
                    Pembelian Daun Internal
                  </CardTitle>
                  <CardDescription>
                    Form for recording internal leaf purchases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/internal-leaf-purchase">
                      Record Leaf Purchase
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🍃</span>
                    Pembelian Daun Kelompok
                  </CardTitle>
                  <CardDescription>
                    Form for recording group leaf purchases.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/leaf-purchase-input">Input Form</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Read-only message for Abu */}
          {!canCreate && (
            <Card className="border-yellow-200 bg-yellow-50 transition-shadow hover:shadow-lg dark:border-yellow-800 dark:bg-yellow-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">ℹ️</span>
                  Read-Only Access
                </CardTitle>
                <CardDescription>
                  Your role has read-only permissions. Contact an administrator
                  to request data entry access.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-gray-200">
            Features
          </h2>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 p-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Group Management</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Organize sales by different seed groups for better tracking.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 p-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Real-time Data</h3>
              <p className="text-gray-600 dark:text-gray-400">
                View sales data and totals updated in real-time.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 p-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Role-Based Access</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Secure permissions based on your assigned role.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
