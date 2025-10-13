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

type InternalLeafPurchaseData = {
  id: number;
  leavesPurchased: number;
  costPerLeaf: number | null;
  totalCost: number | null;
  member: {
    id: number;
    name: string;
  };
  leafType: {
    id: number;
    name: string;
  };
};

export function InternalLeafPurchaseActions({
  purchase,
}: {
  purchase: InternalLeafPurchaseData;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: purchase.member.id.toString(),
    leafTypeId: purchase.leafType.id.toString(),
    leavesPurchased: purchase.leavesPurchased.toString(),
    costPerLeaf: (purchase.costPerLeaf ?? 200).toString(),
  });

  const utils = api.useUtils();
  const { data: members } = api.group.getAll.useQuery(); // Using groups as members
  const { data: leafTypes } = api.leafType.getAll.useQuery();

  const updatePurchase = api.internalLeaf.update.useMutation({
    onSuccess: () => {
      toast.success("Internal leaf purchase updated successfully!");
      setEditOpen(false);
      void utils.internalLeaf.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update internal leaf purchase");
    },
  });

  const deletePurchase = api.internalLeaf.delete.useMutation({
    onSuccess: () => {
      toast.success("Internal leaf purchase deleted successfully!");
      setDeleteOpen(false);
      void utils.internalLeaf.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete internal leaf purchase");
    },
  });

  const handleUpdate = () => {
    const totalCost =
      Number(formData.leavesPurchased) * Number(formData.costPerLeaf);
    updatePurchase.mutate({
      id: purchase.id,
      memberId: Number(formData.memberId),
      leafTypeId: Number(formData.leafTypeId),
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
            <DialogTitle>Edit Internal Leaf Purchase</DialogTitle>
            <DialogDescription>
              Make changes to the internal leaf purchase record. Click save when
              you&lsquo;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="member">Member</Label>
              <Select
                value={formData.memberId}
                onValueChange={(value) =>
                  setFormData({ ...formData, memberId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="leafType">Leaf Type</Label>
              <Select
                value={formData.leafTypeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, leafTypeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leafTypes?.map((leafType) => (
                    <SelectItem
                      key={leafType.id}
                      value={leafType.id.toString()}
                    >
                      {leafType.name}
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
              internal leaf purchase record for {purchase.member.name} (
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
