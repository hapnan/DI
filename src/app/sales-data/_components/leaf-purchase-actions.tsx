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

type LeafPurchaseData = {
  id: number;
  leavesPurchased: number;
  costPerLeaf: number | null;
  totalCost: number | null;
  group: {
    id: number;
    name: string;
  };
};

export function LeafPurchaseActions({
  purchase,
}: {
  purchase: LeafPurchaseData;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({
    groupId: purchase.group.id.toString(),
    leavesPurchased: purchase.leavesPurchased.toString(),
    costPerLeaf: (purchase.costPerLeaf ?? 200).toString(),
  });

  const utils = api.useUtils();
  const { data: groups } = api.group.getAll.useQuery();

  const updatePurchase = api.leafPurchase.update.useMutation({
    onSuccess: () => {
      toast.success("Leaf purchase updated successfully!");
      setEditOpen(false);
      void utils.leafPurchase.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update leaf purchase");
    },
  });

  const deletePurchase = api.leafPurchase.delete.useMutation({
    onSuccess: () => {
      toast.success("Leaf purchase deleted successfully!");
      setDeleteOpen(false);
      void utils.leafPurchase.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete leaf purchase");
    },
  });

  const handleUpdate = () => {
    const totalCost =
      Number(formData.leavesPurchased) * Number(formData.costPerLeaf);
    updatePurchase.mutate({
      id: purchase.id,
      groupId: Number(formData.groupId),
      leavesPurchased: Number(formData.leavesPurchased),
      costPerLeaf: Number(formData.costPerLeaf),
      totalCost,
    });
  };

  const handleDelete = () => {
    deletePurchase.mutate({ id: purchase.id });
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
            onClick={() =>
              navigator.clipboard.writeText(purchase.id.toString())
            }
          >
            Copy Purchase ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Purchase
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Purchase
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Leaf Purchase</DialogTitle>
            <DialogDescription>
              Make changes to the leaf purchase record. Click save when
              you&lsquo;re done.
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
              <Label htmlFor="leavesPurchased">Leaves Purchased</Label>
              <Input
                id="leavesPurchased"
                type="number"
                value={formData.leavesPurchased}
                onChange={(e) =>
                  setFormData({ ...formData, leavesPurchased: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costPerLeaf">Cost per Leaf</Label>
              <Input
                id="costPerLeaf"
                type="number"
                value={formData.costPerLeaf}
                onChange={(e) =>
                  setFormData({ ...formData, costPerLeaf: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Total Cost</Label>
              <Input
                type="number"
                value={
                  Number(formData.leavesPurchased) *
                  Number(formData.costPerLeaf)
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
              disabled={updatePurchase.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updatePurchase.isPending}>
              {updatePurchase.isPending && (
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
              leaf purchase record for {purchase.group.name} (
              {purchase.leavesPurchased} leaves).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePurchase.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePurchase.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePurchase.isPending && (
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
