"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";

export type SaleData = {
  id: number;
  seedsSold: number;
  pricePerSeed: number | null;
  totalPrice: number | null;
  createdAt: Date;
  group: {
    id: number;
    name: string;
  };
};

export const salesColumns: ColumnDef<SaleData>[] = [
  {
    accessorKey: "id",
    header: "Sale ID",
    cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
  },
  {
    id: "groupName",
    accessorKey: "group.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Group Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.original.group.name}</div>,
  },
  {
    accessorKey: "pricePerSeed",
    header: () => <div className="text-right">Price Per Seed</div>,
    cell: ({ row }) => {
      const price = row.getValue("pricePerSeed");
      const formated = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(price ?? 0);

      return <div className="text-right font-mono">{formated}</div>;
    },
  },
  {
    accessorKey: "seedsSold",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Seeds Sold
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue("seedsSold");
      return <div className="text-right font-mono">{amount}</div>;
    },
  },
  {
    accessorKey: "totalPrice",
    header: () => <div className="text-right">Total Price</div>,
    cell: ({ row }) => {
      const price = row.getValue("totalPrice");
      const formated = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(price ?? 0);
      return <div className="text-right font-mono">{formated}</div>;
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt");
      return (
        <div>
          {new Intl.DateTimeFormat("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(date))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const dateRange = value as DateRange | undefined;
      if (!dateRange) return true;

      const rowDate = new Date(row.getValue(id));
      const from = dateRange.from;
      const to = dateRange.to;

      if (from && to) {
        // Set time to start/end of day for accurate comparison
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        return rowDate >= fromDate && rowDate <= toDate;
      } else if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        return rowDate >= fromDate;
      } else if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        return rowDate <= toDate;
      }
      return true;
    },
  },
];
