"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { InlineLoading, ButtonLoading } from "~/components/ui/loading";

import { api } from "~/trpc/react";
import { MdArrowBackIosNew } from "react-icons/md";

const formSchema = z.object({
  groupId: z.string().min(1, "Please select a group"),
  leafTypeId: z.string().min(1, "Please select a leaf type"),
  leavesPurchased: z.string().min(1, "Please enter number of leaves purchased"),
  pricePerLeaf: z.string().min(1, "Please enter price per leaf"),
  totalPrice: z.string().min(1, "Please enter total price"),
});

export default function LeafPurchaseInputPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedLeafTypeId, setSelectedLeafTypeId] = useState<number | null>(
    null,
  );

  // Fetch group price for selected group and leaf type
  const { data: groupPrices } = api.price.getAllGroupPrices.useQuery();

  // Calculate price per leaf based on group price settings
  const getGroupPrice = React.useMemo(() => {
    if (!selectedGroupId || !selectedLeafTypeId || !groupPrices) return null;

    const priceConfig = groupPrices.find(
      (p) =>
        p.groupId === selectedGroupId &&
        p.itemType === "leaf" &&
        p.itemId === selectedLeafTypeId &&
        p.isActive,
    );

    return priceConfig?.price ?? null;
  }, [selectedGroupId, selectedLeafTypeId, groupPrices]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupId: "",
      leafTypeId: "1",
      leavesPurchased: "",
      pricePerLeaf: "",
      totalPrice: "",
    },
  });

  const watchLeavesPurchased = form.watch("leavesPurchased");
  const watchPricePerLeaf = form.watch("pricePerLeaf");

  // Auto-fill price per leaf when group price is available
  React.useEffect(() => {
    if (getGroupPrice !== null) {
      form.setValue("pricePerLeaf", getGroupPrice.toString());
    }
  }, [getGroupPrice, form]);

  React.useEffect(() => {
    const leaves = parseInt(watchLeavesPurchased);
    const pricePerLeaf = parseFloat(watchPricePerLeaf);
    if (!isNaN(leaves) && !isNaN(pricePerLeaf)) {
      const total = leaves * pricePerLeaf;
      form.setValue("totalPrice", total.toString());
    }
  }, [watchLeavesPurchased, watchPricePerLeaf, form]);

  // Get all groups for the select dropdown
  const { data: groups, isLoading: groupsLoading } =
    api.group.getAll.useQuery();

  // Get all leaf types for the select dropdown
  const { data: leafTypes, isLoading: leafTypesLoading } =
    api.leafType.getAll.useQuery();

  // Mutation for creating a leaf purchase
  const createLeafPurchase = api.leafPurchase.create.useMutation({
    onSuccess: () => {
      form.reset();
      setIsSubmitting(false);
      router.push("/sales-data");
    },
    onError: (error) => {
      console.error("Error creating leaf purchase:", error);
      setIsSubmitting(false);
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createLeafPurchase.mutateAsync({
        groupId: parseInt(values.groupId),
        leafTypeId: parseInt(values.leafTypeId),
        leavesPurchased: parseInt(values.leavesPurchased),
      });
    } catch (error) {
      console.error("Submit error:", error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md py-8">
      <div className="flex">
        <Button variant="ghost" asChild>
          <Link href="/">
            <MdArrowBackIosNew /> Back to Home
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Leaf Purchase Entry</CardTitle>
          <CardDescription>Enter leaf purchase data for groups</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        field.onChange(e);
                        setSelectedGroupId(parseInt(e));
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groupsLoading ? (
                          <div className="p-2">
                            <InlineLoading text="Loading groups..." />
                          </div>
                        ) : groups?.length === 0 ? (
                          <SelectItem value="no-groups" disabled>
                            No groups available
                          </SelectItem>
                        ) : (
                          groups?.map((group) => (
                            <SelectItem
                              key={group.id}
                              value={group.id.toString()}
                            >
                              {group.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leafTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leaf Type</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        field.onChange(e);
                        setSelectedLeafTypeId(parseInt(e));
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leaf type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leafTypesLoading ? (
                          <div className="p-2">
                            <InlineLoading text="Loading leaf types..." />
                          </div>
                        ) : leafTypes?.length === 0 ? (
                          <SelectItem value="no-leaf-types" disabled>
                            No leaf types available
                          </SelectItem>
                        ) : (
                          leafTypes?.map((leafType) => (
                            <SelectItem
                              key={leafType.id}
                              value={leafType.id.toString()}
                            >
                              {leafType.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {getGroupPrice !== null && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <span className="font-medium">Group Price:</span> $
                    {getGroupPrice} per leaf
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="leavesPurchased"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Leaves Purchased</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter number of leaves purchased"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricePerLeaf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Per Leaf</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter price per leaf"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter total price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ButtonLoading text="Submitting..." />
                  ) : (
                    "Submit Purchase"
                  )}
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/sales-data">View All Data</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
