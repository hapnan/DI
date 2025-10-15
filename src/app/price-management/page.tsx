"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdArrowBackIosNew } from "react-icons/md";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { SectionLoading } from "~/components/ui/loading";
import { useSession } from "~/lib/auth-client";
import { getUserRole } from "~/lib/session-utils";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { GroupPriceDialog } from "./_components/group-price-dialog";
import { InternalPriceDialog } from "./_components/internal-price-dialog";
import { DeleteConfirmDialog } from "./_components/delete-confirm-dialog";

type GroupPrice = {
  id: number;
  groupId: number;
  groupName: string | null;
  itemType: string;
  itemId: number;
  itemName: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
};

type InternalPrice = {
  id: number;
  itemType: string;
  itemId: number;
  itemName: string;
  roleType: string;
  role: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date;
};

export default function PriceManagementPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const userRole = getUserRole(session);

  const [groupPriceDialogOpen, setGroupPriceDialogOpen] = useState(false);
  const [internalPriceDialogOpen, setInternalPriceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingGroupPrice, setEditingGroupPrice] = useState<GroupPrice | null>(
    null,
  );
  const [editingInternalPrice, setEditingInternalPrice] =
    useState<InternalPrice | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    id: number;
    type: "group" | "internal";
  } | null>(null);

  const { data: groupPrices, isLoading: groupPricesLoading } =
    api.price.getAllGroupPrices.useQuery();
  const { data: internalPrices, isLoading: internalPricesLoading } =
    api.price.getAllInternalPrices.useQuery();

  const utils = api.useUtils();

  const deleteGroupPriceMutation = api.price.deleteGroupPrice.useMutation({
    onSuccess: () => {
      toast.success("Group price deleted successfully!");
      void utils.price.getAllGroupPrices.invalidate();
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to delete group price");
    },
  });

  const deleteInternalPriceMutation = api.price.deleteInternalPrice.useMutation(
    {
      onSuccess: () => {
        toast.success("Internal price deleted successfully!");
        void utils.price.getAllInternalPrices.invalidate();
        setDeleteDialogOpen(false);
        setDeletingItem(null);
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message ?? "Failed to delete internal price");
      },
    },
  );

  const handleEditGroupPrice = (price: GroupPrice) => {
    setEditingGroupPrice(price);
    setGroupPriceDialogOpen(true);
  };

  const handleEditInternalPrice = (price: InternalPrice) => {
    setEditingInternalPrice(price);
    setInternalPriceDialogOpen(true);
  };

  const handleDeleteGroupPrice = (id: number) => {
    setDeletingItem({ id, type: "group" });
    setDeleteDialogOpen(true);
  };

  const handleDeleteInternalPrice = (id: number) => {
    setDeletingItem({ id, type: "internal" });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;

    if (deletingItem.type === "group") {
      deleteGroupPriceMutation.mutate({ id: deletingItem.id });
    } else {
      deleteInternalPriceMutation.mutate({ id: deletingItem.id });
    }
  };

  const handleGroupPriceDialogClose = () => {
    setGroupPriceDialogOpen(false);
    setEditingGroupPrice(null);
  };

  const handleInternalPriceDialogClose = () => {
    setInternalPriceDialogOpen(false);
    setEditingInternalPrice(null);
  };

  // Redirect if not Raden
  useEffect(() => {
    if (!sessionLoading && userRole !== "Raden") {
      router.push("/");
    }
  }, [sessionLoading, userRole, router]);

  if (sessionLoading) {
    return <SectionLoading />;
  }

  if (userRole !== "Raden") {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/">
            <MdArrowBackIosNew className="mr-2" /> Back to Home
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Price Management</h1>
        <p className="text-muted-foreground">
          Manage pricing for groups and internal roles
        </p>
      </div>

      <Tabs defaultValue="group" className="space-y-6">
        <TabsList>
          <TabsTrigger value="group">Group Prices</TabsTrigger>
          <TabsTrigger value="internal">Internal Prices</TabsTrigger>
        </TabsList>

        {/* Group Prices Tab */}
        <TabsContent value="group" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Group Prices (External)</CardTitle>
                  <CardDescription>
                    Set specific prices for each group
                  </CardDescription>
                </div>
                <Button onClick={() => setGroupPriceDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Group Price
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groupPricesLoading ? (
                <SectionLoading />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Item Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupPrices?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-muted-foreground text-center"
                        >
                          No group prices configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupPrices?.map((price) => (
                        <TableRow key={price.id}>
                          <TableCell className="font-medium">
                            {price.groupName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {price.itemType === "seed" ? "Seed" : "Leaf"}
                            </Badge>
                          </TableCell>
                          <TableCell>{price.itemName}</TableCell>
                          <TableCell className="font-semibold">
                            ${price.price}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={price.isActive ? "default" : "secondary"}
                            >
                              {price.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditGroupPrice(price)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteGroupPrice(price.id)}
                              >
                                <Trash2 className="text-destructive h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Internal Prices Tab */}
        <TabsContent value="internal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Internal Prices (Role-based)</CardTitle>
                  <CardDescription>
                    Set prices for internal transactions based on roles
                  </CardDescription>
                </div>
                <Button onClick={() => setInternalPriceDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Internal Price
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {internalPricesLoading ? (
                <SectionLoading />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Role Type</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {internalPrices?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-muted-foreground text-center"
                        >
                          No internal prices configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      internalPrices?.map((price) => (
                        <TableRow key={price.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {price.itemType === "seed" ? "Seed" : "Leaf"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {price.itemName}
                          </TableCell>
                          <TableCell>
                            <Badge>
                              {price.roleType === "all"
                                ? "All Roles"
                                : "Specific"}
                            </Badge>
                          </TableCell>
                          <TableCell>{price.role ?? "All"}</TableCell>
                          <TableCell className="font-semibold">
                            ${price.price}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={price.isActive ? "default" : "secondary"}
                            >
                              {price.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditInternalPrice(price)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteInternalPrice(price.id)
                                }
                              >
                                <Trash2 className="text-destructive h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <GroupPriceDialog
        open={groupPriceDialogOpen}
        onOpenChange={handleGroupPriceDialogClose}
        editingPrice={editingGroupPrice}
      />

      <InternalPriceDialog
        open={internalPriceDialogOpen}
        onOpenChange={handleInternalPriceDialogClose}
        editingPrice={editingInternalPrice}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={
          deleteGroupPriceMutation.isPending ||
          deleteInternalPriceMutation.isPending
        }
      />
    </div>
  );
}
