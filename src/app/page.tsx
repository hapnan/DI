import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  // Prefetch some data for better performance
  void api.sale.getTotalSold.prefetch();

  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-200">
              Seed Sales & Leaf Purchase Tracker
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
              Track and manage your seed sales and leaf purchases efficiently
              with our simple, powerful interface.
            </p>
          </div>

          {/* Action Cards */}
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  Setup Groups
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

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🌱</span>
                  Record Seed Sales
                </CardTitle>
                <CardDescription>
                  Add new seed sales records with group selection and quantity
                  input.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/sales-input">Record Seed Sales</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🍃</span>
                  Record Leaf Purchase
                </CardTitle>
                <CardDescription>
                  Add new leaf purchase records with group selection and
                  quantity input.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/leaf-purchase-input">Record Leaf Purchase</Link>
                </Button>
              </CardContent>
            </Card>

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
                <h3 className="mb-2 text-lg font-semibold">Easy Input</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Simple form interface for quick data entry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
