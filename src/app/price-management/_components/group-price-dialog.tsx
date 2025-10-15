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

const formSchema = z.object({
  groupId: z.number({ message: "Please select a group" }),
  itemType: z.enum(["seed", "leaf"], { message: "Please select an item type" }),
  itemId: z.number({ message: "Please select an item" }),
  price: z
    .number({ message: "Please enter a price" })
    .min(0, "Price must be non-negative"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

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

interface GroupPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPrice: GroupPrice | null;
}

export function GroupPriceDialog({
  open,
  onOpenChange,
  editingPrice,
}: GroupPriceDialogProps) {
  const [selectedItemType, setSelectedItemType] = useState<
    "seed" | "leaf" | null
  >(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const { data: groups } = api.price.getAllGroups.useQuery();
  const { data: seedTypes } = api.price.getAllSeedTypes.useQuery();
  const { data: leafTypes } = api.price.getAllLeafTypes.useQuery();

  const utils = api.useUtils();

  const createMutation = api.price.createGroupPrice.useMutation({
    onSuccess: () => {
      toast.success("Group price created successfully!");
      void utils.price.getAllGroupPrices.invalidate();
      onOpenChange(false);
      form.reset();
      setSelectedItemType(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to create group price");
    },
  });

  const updateMutation = api.price.updateGroupPrice.useMutation({
    onSuccess: () => {
      toast.success("Group price updated successfully!");
      void utils.price.getAllGroupPrices.invalidate();
      onOpenChange(false);
      form.reset();
      setSelectedItemType(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to update group price");
    },
  });

  useEffect(() => {
    if (editingPrice) {
      form.reset({
        groupId: editingPrice.groupId,
        itemType: editingPrice.itemType as "seed" | "leaf",
        itemId: editingPrice.itemId,
        price: editingPrice.price,
        isActive: editingPrice.isActive,
      });
      setSelectedItemType(editingPrice.itemType as "seed" | "leaf");
    } else {
      form.reset({
        isActive: true,
      });
      setSelectedItemType(null);
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
      createMutation.mutate({
        groupId: values.groupId,
        itemType: values.itemType,
        itemId: values.itemId,
        price: values.price,
      });
    }
  };

  const handleItemTypeChange = (value: string) => {
    setSelectedItemType(value as "seed" | "leaf");
    form.setValue("itemType", value as "seed" | "leaf");
    form.setValue("itemId", 0 as never); // Reset item selection
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
          <DialogTitle>{editingPrice ? "Edit" : "Add"} Group Price</DialogTitle>
          <DialogDescription>
            {editingPrice
              ? "Update the price and status for this group"
              : "Set a price for a specific item for a group"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                    disabled={!!editingPrice}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups?.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? undefined : value);
                      }}
                      value={
                        field.value === undefined || isNaN(field.value)
                          ? ""
                          : field.value
                      }
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
