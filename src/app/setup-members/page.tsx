"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Loader2, Trash2, Users, Pencil, MoreHorizontal } from "lucide-react";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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
import { Label } from "~/components/ui/label";
import Link from "next/link";
import { MdArrowBackIosNew } from "react-icons/md";

const memberSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(256, "Name is too long"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function SetupMembersPage() {
  const utils = api.useUtils();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editFormData, setEditFormData] = React.useState({ name: "" });

  // Fetch all groups/members
  const { data: members, isLoading: membersLoading } =
    api.members.getAll.useQuery();

  // Create member/group mutation
  const createMember = api.members.create.useMutation({
    onSuccess: () => {
      toast.success("Member added successfully!");
      form.reset();
      void utils.members.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add member");
    },
  });

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: MemberFormValues) {
    createMember.mutate({
      name: values.name,
    });
  }

  // Delete member mutation
  const deleteMember = api.members.delete.useMutation({
    onSuccess: () => {
      toast.success("Member deleted successfully!");
      setDeleteOpen(false);
      setSelectedMember(null);
      void utils.members.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete member");
    },
  });

  // Update member mutation
  const updateMember = api.members.update.useMutation({
    onSuccess: () => {
      toast.success("Member updated successfully!");
      setEditOpen(false);
      setSelectedMember(null);
      void utils.members.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update member");
    },
  });

  function handleEditClick(member: { id: number; name: string }) {
    setSelectedMember(member);
    setEditFormData({ name: member.name });
    setEditOpen(true);
  }

  function handleDeleteClick(member: { id: number; name: string }) {
    setSelectedMember(member);
    setDeleteOpen(true);
  }

  function handleEditSubmit() {
    if (selectedMember && editFormData.name.trim()) {
      updateMember.mutate({
        id: selectedMember.id,
        name: editFormData.name.trim(),
      });
    }
  }

  function handleDeleteConfirm() {
    if (selectedMember) {
      deleteMember.mutate({ id: selectedMember.id });
    }
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-8 py-10">
      <div className="flex">
        <Button variant="ghost" asChild>
          <Link href="/">
            <MdArrowBackIosNew /> Back to Home
          </Link>
        </Button>
      </div>
      {/* Add Member Form */}
      <Card className="mx-auto mt-3 max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <CardTitle>Add New Member</CardTitle>
          </div>
          <CardDescription>
            Add new group members to the system for tracking seed sales and leaf
            purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group/Member Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter group or member name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The name of the group or individual member
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMember.isPending}
                  className="flex-1"
                >
                  {createMember.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
          <CardDescription>
            List of all registered group members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : members && members.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.id}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
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
                              onClick={() => handleEditClick(member)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(member)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-lg font-medium">No members yet</p>
              <p className="text-muted-foreground text-sm">
                Add your first member using the form above
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update the member&apos;s name below
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ name: e.target.value })}
                placeholder="Enter member name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateMember.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateMember.isPending || !editFormData.name.trim()}
            >
              {updateMember.isPending && (
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
              This will permanently delete the member &quot;
              {selectedMember?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMember.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMember.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMember.isPending && (
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
