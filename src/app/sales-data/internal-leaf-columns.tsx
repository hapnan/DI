"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { InternalLeafPurchaseActions } from "./_components/internal-leaf-purchase-actions";

export type LeafPurchaseData = {
  id: number;
  leavesPurchased: number;
  costPerLeaf: number | null;
  totalCost: number | null;
  createdAt: Date;
  member: {
    id: number;
    name: string;
  };
  leafType: {
    id: number;
    name: string;
  };
};

export const internalLeafPurchaseColumns: ColumnDef<LeafPurchaseData>[] = [
  {
    accessorKey: "id",
    header: "Purchase ID",
    cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
  },
  {
    id: "memberName",
    accessorKey: "member.name",
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
    cell: ({ row }) => <div>{row.original.member.name}</div>,
  },
  {
    id: "leafTypeName",
    accessorKey: "leafType.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Leaf Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.original.leafType.name}</div>,
  },
  {
    accessorKey: "costPerLeaf",
    header: () => <div className="text-right">Cost Per Leaf</div>,
    cell: ({ row }) => {
      const cost: number | null = row.getValue("costPerLeaf");
      return (
        <div className="text-right font-mono">
          {cost?.toLocaleString() ?? "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "leavesPurchased",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Leaves Purchased
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount: number = row.getValue("leavesPurchased");
      return <div className="text-right font-mono">{amount}</div>;
    },
  },
  {
    accessorKey: "totalCost",
    header: () => <div className="text-right">Total Cost</div>,
    cell: ({ row }) => {
      const cost = row.getValue("totalCost");
      return (
        <div className="text-right font-mono">
          {cost?.toLocaleString() ?? "N/A"}
        </div>
      );
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
      // Handle different date formats safely
      const dateObj =
        date instanceof Date ? date : new Date(date as string | number);

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return <div>Invalid Date</div>;
      }
      return (
        <div>
          {new Intl.DateTimeFormat("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(dateObj))}
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
  {
    id: "actions",
    cell: ({ row }) => <InternalLeafPurchaseActions purchase={row.original} />,
  },
];
