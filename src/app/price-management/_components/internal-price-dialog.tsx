"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";
import { toast } from "sonner";

const formSchema = z
  .object({
    itemType: z.enum(["seed", "leaf"], {
      message: "Please select an item type",
    }),
    itemId: z.number({ message: "Please select an item" }),
    roleType: z.enum(["all", "specific"], {
      message: "Please select a role type",
    }),
    role: z.string().nullable().optional(),
    price: z
      .number({ message: "Please enter a price" })
      .min(0, "Price must be non-negative"),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.roleType === "specific") {
        return !!data.role;
      }
      return true;
    },
    {
      message: "Role is required when role type is specific",
      path: ["role"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

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

interface InternalPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPrice: InternalPrice | null;
}

const USER_ROLES = ["Raden", "Ultra", "Ijo", "Abu"] as const;

export function InternalPriceDialog({
  open,
  onOpenChange,
  editingPrice,
}: InternalPriceDialogProps) {
  const [selectedItemType, setSelectedItemType] = useState<
    "seed" | "leaf" | null
  >(null);
  const [selectedRoleType, setSelectedRoleType] = useState<
    "all" | "specific" | null
  >(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: true,
      roleType: "specific",
      role: null,
    },
  });

  const { data: seedTypes } = api.price.getAllSeedTypes.useQuery();
  const { data: leafTypes } = api.price.getAllLeafTypes.useQuery();

  const utils = api.useUtils();

  const createMutation = api.price.createInternalPrice.useMutation({
    onSuccess: () => {
      toast.success("Internal price created successfully!");
      void utils.price.getAllInternalPrices.invalidate();
      onOpenChange(false);
      form.reset();
      setSelectedItemType(null);
      setSelectedRoleType(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to create internal price");
    },
  });

  const updateMutation = api.price.updateInternalPrice.useMutation({
    onSuccess: () => {
      toast.success("Internal price updated successfully!");
      void utils.price.getAllInternalPrices.invalidate();
      onOpenChange(false);
      form.reset();
      setSelectedItemType(null);
      setSelectedRoleType(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to update internal price");
    },
  });

  useEffect(() => {
    if (editingPrice) {
      form.reset({
        itemType: editingPrice.itemType as "seed" | "leaf",
        itemId: editingPrice.itemId,
        roleType: editingPrice.roleType as "all" | "specific",
        role: editingPrice.role,
        price: editingPrice.price,
        isActive: editingPrice.isActive,
      });
      setSelectedItemType(editingPrice.itemType as "seed" | "leaf");
      setSelectedRoleType(editingPrice.roleType as "all" | "specific");
    } else {
      form.reset({
        isActive: true,
        roleType: "specific",
        role: null,
      });
      setSelectedItemType(null);
      setSelectedRoleType(null);
    }
  }, [editingPrice, form]);

  const onSubmit = (values: FormValues) => {
    if (editingPrice) {
      updateMutation.mutate({
        id: editingPrice.id,
        price: values.price,
        isActive: values.isActive,
      });
    } else {
      const role =
        values.roleType === "specific" && values.role
          ? (values.role as "Raden" | "Ultra" | "Ijo" | "Abu")
          : undefined;

      createMutation.mutate({
        itemType: values.itemType,
        itemId: values.itemId,
        roleType: values.roleType,
        role,
        price: values.price,
      });
    }
  };

  const handleItemTypeChange = (value: string) => {
    setSelectedItemType(value as "seed" | "leaf");
    form.setValue("itemType", value as "seed" | "leaf");
    form.setValue("itemId", 0 as never); // Reset item selection
  };

  const handleRoleTypeChange = (value: string) => {
    setSelectedRoleType(value as "all" | "specific");
    form.setValue("roleType", value as "all" | "specific");
    if (value === "all") {
      form.setValue("role", null);
    }
  };

  const itemOptions =
    selectedItemType === "seed"
      ? seedTypes
      : selectedItemType === "leaf"
        ? leafTypes
        : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingPrice ? "Edit" : "Add"} Internal Price
          </DialogTitle>
          <DialogDescription>
            {editingPrice
              ? "Update the price and status for this internal item"
              : "Set a price for internal transactions based on roles"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Type</FormLabel>
                  <Select
                    onValueChange={handleItemTypeChange}
                    value={field.value}
                    disabled={!!editingPrice}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="leaf">Leaf</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                    disabled={!selectedItemType || !!editingPrice}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itemOptions?.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {!selectedItemType && "Please select an item type first"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Type</FormLabel>
                  <Select
                    onValueChange={handleRoleTypeChange}
                    value={field.value}
                    disabled={!!editingPrice}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="specific">Specific Role</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set price for all roles or a specific role
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRoleType === "specific" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                      disabled={!!editingPrice}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Set this price as active for use
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingPrice
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
