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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { SectionLoading } from "~/components/ui/loading";
import { DataTable } from "~/components/ui/data-table";
import { salesColumns } from "./sales-columns";
import { leafPurchaseColumns } from "./leaf-purchase-columns";
import { internalSalesColumns } from "./internal-sale-columns";
import { internalLeafPurchaseColumns } from "./internal-leaf-columns";
import { api } from "~/trpc/react";
import { MdArrowBackIosNew } from "react-icons/md";
import { useState } from "react";

export default function SalesDataPage() {
  // Pagination state for sales
  const [salesPagination, setSalesPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Get all sales data with group information (with pagination)
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = api.sale.getAll.useQuery({
    limit: salesPagination.pageSize,
    offset: salesPagination.pageIndex * salesPagination.pageSize,
  });

  const {
    data: internalSales,
    isLoading: internalSalesLoading,
    error: internalSalesError,
  } = api.internalSeed.getAll.useQuery();

  // Get all leaf purchase data with group information
  const {
    data: leafPurchases,
    isLoading: leafPurchasesLoading,
    error: leafPurchasesError,
  } = api.leafPurchase.getAll.useQuery();

  const {
    data: internalLeafPurchases,
    isLoading: internalLeafPurchasesLoading,
    error: internalLeafPurchasesError,
  } = api.internalLeaf.getAll.useQuery();

  // Get total seeds sold
  const { data: totalSold } = api.sale.getTotalSold.useQuery();

  const { data: internalTotalSold } =
    api.internalSeed.getTotalSeedsSold.useQuery();

  // Get total leaves purchased
  const { data: totalPurchased } =
    api.leafPurchase.getTotalPurchased.useQuery();

  const { data: internalTotalPurchased } =
    api.internalLeaf.getTotalPurchased.useQuery();

  return (
    <div className="container mx-auto py-8">
      <div className="flex">
        <Button variant="ghost" asChild>
          <Link href="/">
            <MdArrowBackIosNew /> Back to Home
          </Link>
        </Button>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <Card className="min-h-96">
          <CardHeader>
            <CardTitle>Sales & Purchase Data</CardTitle>
            <CardDescription>
              View all seed sales and leaf purchase records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sales">Seed Sales</TabsTrigger>
                <TabsTrigger value="purchases">Leaf Purchases</TabsTrigger>
              </TabsList>

              {/* Seed Sales Tab */}
              <TabsContent value="sales">
                {salesLoading ? (
                  <SectionLoading text="Loading seed sales data..." />
                ) : salesError ? (
                  <div className="py-4 text-red-600">
                    Error loading seed sales: {salesError.message}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        {totalSold !== undefined && (
                          <span className="text-sm font-medium">
                            Total Seeds Sold: {totalSold.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Button asChild>
                        <Link href="/sales-input">Add Seed Sale</Link>
                      </Button>
                    </div>

                    {!salesData?.data || salesData.data.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <p>No seed sales data found.</p>
                        <p className="mt-2">
                          <Link
                            href="/sales-input"
                            className="text-blue-600 hover:underline"
                          >
                            Add your first sale
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <DataTable
                        columns={salesColumns}
                        data={salesData.data}
                        searchKey="groupName"
                        searchPlaceholder="Filter by group name..."
                        dateFilterKey="createdAt"
                        manualPagination={true}
                        pageCount={salesData.pageCount}
                        pageIndex={salesPagination.pageIndex}
                        pageSize={salesPagination.pageSize}
                        onPaginationChange={setSalesPagination}
                      />
                    )}
                  </>
                )}
              </TabsContent>

              {/* Leaf Purchases Tab */}
              <TabsContent value="purchases">
                {leafPurchasesLoading ? (
                  <SectionLoading text="Loading leaf purchase data..." />
                ) : leafPurchasesError ? (
                  <div className="py-4 text-red-600">
                    Error loading leaf purchases: {leafPurchasesError.message}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        {totalPurchased !== undefined && (
                          <span className="text-sm font-medium">
                            Total Leaves Purchased:{" "}
                            {totalPurchased.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Button asChild>
                        <Link href="/leaf-purchase-input">
                          Add Leaf Purchase
                        </Link>
                      </Button>
                    </div>

                    {!leafPurchases || leafPurchases.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <p>No leaf purchase data found.</p>
                        <p className="mt-2">
                          <Link
                            href="/leaf-purchase-input"
                            className="text-blue-600 hover:underline"
                          >
                            Add your first purchase
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <DataTable
                        columns={leafPurchaseColumns}
                        data={leafPurchases}
                        searchKey="groupName"
                        searchPlaceholder="Filter by group name..."
                        dateFilterKey="createdAt"
                      />
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="min-h-96">
          <CardHeader>
            <CardTitle>Internal Sales & Purchase Data</CardTitle>
            <CardDescription>
              View all seed sales and leaf purchase internal records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sales">Seed Sales</TabsTrigger>
                <TabsTrigger value="purchases">Leaf Purchases</TabsTrigger>
              </TabsList>

              {/* Seed Sales Tab */}
              <TabsContent value="sales">
                {internalSalesLoading ? (
                  <SectionLoading text="Loading seed sales data..." />
                ) : internalSalesError ? (
                  <div className="py-4 text-red-600">
                    Error loading seed sales: {internalSalesError.message}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        {internalTotalSold !== undefined && (
                          <span className="text-sm font-medium">
                            Total Seeds Sold:{" "}
                            {internalTotalSold.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Button asChild>
                        <Link href="/sales-input">Add Seed Sale</Link>
                      </Button>
                    </div>

                    {!internalSales || internalSales.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <p>No seed sales data found.</p>
                        <p className="mt-2">
                          <Link
                            href="/sales-input"
                            className="text-blue-600 hover:underline"
                          >
                            Add your first sale
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <DataTable
                        columns={internalSalesColumns}
                        data={internalSales}
                        searchKey="memberName"
                        searchPlaceholder="Filter by member name..."
                        dateFilterKey="createdAt"
                      />
                    )}
                  </>
                )}
              </TabsContent>

              {/* Leaf Purchases Tab */}
              <TabsContent value="purchases">
                {internalLeafPurchasesLoading ? (
                  <SectionLoading text="Loading leaf purchase data..." />
                ) : internalLeafPurchasesError ? (
                  <div className="py-4 text-red-600">
                    Error loading leaf purchases:{" "}
                    {internalLeafPurchasesError.message}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        {internalTotalPurchased !== undefined && (
                          <span className="text-sm font-medium">
                            Total Leaves Purchased:{" "}
                            {internalTotalPurchased.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Button asChild>
                        <Link href="/leaf-purchase-input">
                          Add Leaf Purchase
                        </Link>
                      </Button>
                    </div>

                    {!internalLeafPurchases ||
                    internalLeafPurchases.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <p>No leaf purchase data found.</p>
                        <p className="mt-2">
                          <Link
                            href="/leaf-purchase-input"
                            className="text-blue-600 hover:underline"
                          >
                            Add your first purchase
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <DataTable
                        columns={internalLeafPurchaseColumns}
                        data={internalLeafPurchases}
                        searchKey="memberName"
                        searchPlaceholder="Filter by group name..."
                        dateFilterKey="createdAt"
                      />
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
