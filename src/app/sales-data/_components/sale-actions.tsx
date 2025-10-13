"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type SaleData = {
  id: number;
  seedsSold: number;
  pricePerSeed: number | null;
  totalPrice: number | null;
  group: {
    id: number;
    name: string;
  };
};

export function SaleActions({ sale }: { sale: SaleData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({
    groupId: sale.group.id.toString(),
    seedsSold: sale.seedsSold.toString(),
    pricePerSeed: (sale.pricePerSeed ?? 700).toString(),
  });

  const utils = api.useUtils();
  const { data: groups } = api.group.getAll.useQuery();

  const updateSale = api.sale.update.useMutation({
    onSuccess: () => {
      toast.success("Sale updated successfully!");
      setEditOpen(false);
      void utils.sale.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update sale");
    },
  });

  const deleteSale = api.sale.delete.useMutation({
    onSuccess: () => {
      toast.success("Sale deleted successfully!");
      setDeleteOpen(false);
      void utils.sale.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete sale");
    },
  });

  const handleUpdate = () => {
    const totalPrice =
      Number(formData.seedsSold) * Number(formData.pricePerSeed);
    updateSale.mutate({
      id: sale.id,
      groupId: Number(formData.groupId),
      seedsSold: Number(formData.seedsSold),
      pricePerSeed: Number(formData.pricePerSeed),
      totalPrice,
    });
  };

  const handleDelete = () => {
    deleteSale.mutate({ id: sale.id });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(sale.id.toString())}
          >
            Copy Sale ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Sale
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Sale
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>
              Make changes to the sale record. Click save when you&lsquo;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="group">Group</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seedsSold">Seeds Sold</Label>
              <Input
                id="seedsSold"
                type="number"
                value={formData.seedsSold}
                onChange={(e) =>
                  setFormData({ ...formData, seedsSold: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pricePerSeed">Price per Seed</Label>
              <Input
                id="pricePerSeed"
                type="number"
                value={formData.pricePerSeed}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerSeed: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Total Price</Label>
              <Input
                type="number"
                value={
                  Number(formData.seedsSold) * Number(formData.pricePerSeed)
                }
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateSale.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateSale.isPending}>
              {updateSale.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              sale record for {sale.group.name} ({sale.seedsSold} seeds).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSale.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSale.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteSale.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
