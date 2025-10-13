"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SectionLoading, ButtonLoading } from "~/components/ui/loading";
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
import { api } from "~/trpc/react";
import { MdArrowBackIosNew } from "react-icons/md";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SetupPage() {
  const [groupName, setGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "" });

  const utils = api.useUtils();

  // Get all groups
  const { data: groups, isLoading: groupsLoading } =
    api.group.getAll.useQuery();

  // Create group mutation
  const createGroup = api.group.create.useMutation({
    onSuccess: () => {
      setGroupName("");
      setIsSubmitting(false);
      toast.success("Group created successfully!");
      void utils.group.getAll.invalidate();
    },
    onError: (error) => {
      console.error("Error creating group:", error);
      toast.error(error.message || "Failed to create group");
      setIsSubmitting(false);
    },
  });

  // Update group mutation
  const updateGroup = api.group.update.useMutation({
    onSuccess: () => {
      toast.success("Group updated successfully!");
      setEditOpen(false);
      setSelectedGroup(null);
      void utils.group.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update group");
    },
  });

  // Delete group mutation
  const deleteGroup = api.group.delete.useMutation({
    onSuccess: () => {
      toast.success("Group deleted successfully!");
      setDeleteOpen(false);
      setSelectedGroup(null);
      void utils.group.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    try {
      await createGroup.mutateAsync({ name: groupName.trim() });
    } catch (error) {
      console.error("Submit error:", error);
      setIsSubmitting(false);
    }
  };

  const createSampleGroups = async () => {
    const sampleGroups = [
      "Tomato Seeds",
      "Lettuce Seeds",
      "Carrot Seeds",
      "Bean Seeds",
      "Sunflower Seeds",
    ];

    setIsSubmitting(true);
    try {
      for (const groupName of sampleGroups) {
        await createGroup.mutateAsync({ name: groupName });
      }
      toast.success("Sample groups created successfully!");
    } catch (error) {
      console.error("Error creating sample groups:", error);
    }
    setIsSubmitting(false);
  };

  function handleEditClick(group: { id: number; name: string }) {
    setSelectedGroup(group);
    setEditFormData({ name: group.name });
    setEditOpen(true);
  }

  function handleDeleteClick(group: { id: number; name: string }) {
    setSelectedGroup(group);
    setDeleteOpen(true);
  }

  function handleEditSubmit() {
    if (selectedGroup && editFormData.name.trim()) {
      updateGroup.mutate({
        id: selectedGroup.id,
        name: editFormData.name.trim(),
      });
    }
  }

  function handleDeleteConfirm() {
    if (selectedGroup) {
      deleteGroup.mutate({ id: selectedGroup.id });
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="flex">
        <Button variant="ghost" asChild>
          <Link href="/">
            <MdArrowBackIosNew /> Back to Home
          </Link>
        </Button>
      </div>
      <Card className="mx-auto mt-3 max-w-2xl">
        <CardHeader>
          <CardTitle>Setup Groups</CardTitle>
          <CardDescription>
            Create seed groups before recording sales data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create sample groups */}
          <div>
            <Label className="text-base font-medium">Quick Setup</Label>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Create some common seed groups to get started quickly
            </p>
            <Button
              onClick={createSampleGroups}
              disabled={isSubmitting}
              variant="outline"
              className="w-full"
            >
              {isSubmitting ? (
                <ButtonLoading text="Creating..." />
              ) : (
                "Create Sample Groups"
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Or create custom groups
              </span>
            </div>
          </div>

          {/* Create custom group */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name (e.g., Tomato Seeds)"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                disabled={!groupName.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <ButtonLoading text="Creating..." />
                ) : (
                  "Create Group"
                )}
              </Button>
            </div>
          </form>

          {/* Existing groups */}
          <div>
            <Label className="text-base font-medium">Existing Groups</Label>
            {groupsLoading ? (
              <SectionLoading text="Loading groups..." />
            ) : groups && groups.length > 0 ? (
              <div className="mt-3 space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div className="flex flex-col">
                      <span>{group.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {group.id}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleEditClick(group)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(group)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mt-3 text-sm">
                No groups created yet. Create your first group above.
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/sales-input">Go to Sales Input</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group&apos;s name below
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ name: e.target.value })}
                placeholder="Enter group name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateGroup.isPending || !editFormData.name.trim()}
            >
              {updateGroup.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group &quot;{selectedGroup?.name}
              &quot;. This action cannot be undone and may affect related sales
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGroup.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteGroup.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteGroup.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
