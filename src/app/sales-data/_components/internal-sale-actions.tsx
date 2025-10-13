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
import { useSession } from "~/lib/auth-client";

type InternalSaleData = {
  id: number;
  seedsSold: number;
  pricePerSeed: number | null;
  totalPrice: number | null;
  userId?: string;
  member: {
    id: number;
    name: string;
  };
  seedType: {
    id: number;
    name: string;
  };
};

export function InternalSaleActions({ sale }: { sale: InternalSaleData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "Abu";
  const userId = session?.user?.id;

  const [formData, setFormData] = useState({
    memberId: sale.member.id.toString(),
    seedTypeId: sale.seedType.id.toString(),
    seedsSold: sale.seedsSold.toString(),
  });

  // Check permissions
  const canEdit = () => {
    if (userRole === "Abu") return false;
    if (userRole === "Ijo") return sale.userId === userId;
    return true;
  };

  const canDelete = () => {
    return userRole === "Ultra" || userRole === "Raden";
  };

  const utils = api.useUtils();
  const { data: members } = api.members.getAll.useQuery();
  const { data: seedTypes } = api.seedType.getAll.useQuery();

  const updateSale = api.internalSeed.update.useMutation({
    onSuccess: () => {
      toast.success("Internal sale updated successfully!");
      setEditOpen(false);
      void utils.internalSeed.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update internal sale");
    },
  });

  const deleteSale = api.internalSeed.delete.useMutation({
    onSuccess: () => {
      toast.success("Internal sale deleted successfully!");
      setDeleteOpen(false);
      void utils.internalSeed.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete internal sale");
    },
  });

  const handleUpdate = () => {
    updateSale.mutate({
      id: sale.id,
      memberId: Number(formData.memberId),
      seedTypeId: Number(formData.seedTypeId),
      seedsSold: Number(formData.seedsSold),
    });
  };

  const handleDelete = () => {
    deleteSale.mutate({ id: sale.id });
  };

  if (!canEdit() && !canDelete()) {
    return null;
  }

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
          {canEdit() && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Sale
            </DropdownMenuItem>
          )}
          {canDelete() && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Sale
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Internal Sale</DialogTitle>
            <DialogDescription>
              Make changes to the internal sale record. Click save when
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
              <Label htmlFor="seedType">Seed Type</Label>
              <Select
                value={formData.seedTypeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, seedTypeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seedTypes?.map((seedType) => (
                    <SelectItem
                      key={seedType.id}
                      value={seedType.id.toString()}
                    >
                      {seedType.name}
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
            <div className="bg-muted/50 rounded-md border p-3">
              <p className="text-muted-foreground text-sm">
                Price will be automatically calculated based on your role when
                saved.
              </p>
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
              internal sale record for {sale.member.name} ({sale.seedsSold}{" "}
              seeds).
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
