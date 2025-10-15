"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdArrowBackIosNew } from "react-icons/md";
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

const formSchema = z.object({
  groupId: z.string().min(1, "Please select a group"),
  seedTypeId: z.string().min(1, "Please select a seed type"),
  seedsSold: z.string().min(1, "Please enter number of seeds sold"),
  totalPrice: z.string().min(1, "Please enter total price"),
  pricePerSeed: z.string().min(1, "Please enter price per seed"),
});

export default function SalesInputPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedSeedTypeId, setSelectedSeedTypeId] = useState<number | null>(
    null,
  );

  const { data: weeklyLimits } = api.weeklyLimit.getCurrentLimit.useQuery(
    { groupId: selectedGroupId! },
    { enabled: !!selectedGroupId },
  );

  // Fetch group price for selected group and seed type
  const { data: groupPrices } = api.price.getAllGroupPrices.useQuery();

  // Calculate price per seed based on group price settings
  const getGroupPrice = React.useMemo(() => {
    if (!selectedGroupId || !selectedSeedTypeId || !groupPrices) return null;

    const priceConfig = groupPrices.find(
      (p) =>
        p.groupId === selectedGroupId &&
        p.itemType === "seed" &&
        p.itemId === selectedSeedTypeId &&
        p.isActive,
    );

    return priceConfig?.price ?? null;
  }, [selectedGroupId, selectedSeedTypeId, groupPrices]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupId: "",
      seedsSold: "",
      totalPrice: "",
      pricePerSeed: "",
    },
  });

  const watchSeedsSold = form.watch("seedsSold");
  const watchPricePerSeed = form.watch("pricePerSeed");
  const watchSeedsTypeId = form.watch("seedTypeId");

  // Auto-fill price per seed when group price is available
  React.useEffect(() => {
    if (getGroupPrice !== null) {
      form.setValue("pricePerSeed", getGroupPrice.toString());
    } else {
      form.setValue("pricePerSeed", "");
    }
  }, [getGroupPrice, form]);

  React.useEffect(() => {
    const seeds = parseInt(watchSeedsSold);
    const pricePerSeed = parseFloat(watchPricePerSeed);
    if (!isNaN(seeds) && !isNaN(pricePerSeed)) {
      const total = seeds * pricePerSeed;
      form.setValue("totalPrice", total.toString());
    }
  }, [watchSeedsSold, watchPricePerSeed, form]);

  // Get all groups for the select dropdown
  const { data: groups, isLoading: groupsLoading } =
    api.group.getAll.useQuery();

  // Get all seed types for the select dropdown
  const { data: seedTypes, isLoading: seedTypesLoading } =
    api.seedType.getAll.useQuery();

  // Mutation for creating a sale
  const createSale = api.sale.create.useMutation({
    onSuccess: () => {
      form.reset();
      setIsSubmitting(false);
      router.push("/sales-data");
    },
    onError: (error) => {
      console.error("Error creating sale:", error);
      setIsSubmitting(false);
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createSale.mutateAsync({
        groupId: parseInt(values.groupId),
        seedTypeId: parseInt(values.seedTypeId),
        seedsSold: parseInt(values.seedsSold),
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
      <Card className="mt-2.5">
        <CardHeader>
          <CardTitle>Seed Sales Entry</CardTitle>
          <CardDescription>Enter sales data for seed groups</CardDescription>
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
                name="seedTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seed Type</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        field.onChange(e);
                        setSelectedSeedTypeId(parseInt(e));
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select seed type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {seedTypesLoading ? (
                          <div className="p-2">
                            <InlineLoading text="Loading seed types..." />
                          </div>
                        ) : seedTypes?.length === 0 ? (
                          <SelectItem value="no-seed-types" disabled>
                            No seed types available
                          </SelectItem>
                        ) : (
                          seedTypes?.map((seedType) => (
                            <SelectItem
                              key={seedType.id}
                              value={seedType.id.toString()}
                            >
                              {seedType.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {weeklyLimits && (
                <div className="rounded-md border p-4">
                  <p className="text-sm">
                    <span className="font-medium">Weekly Limit:</span>{" "}
                    {weeklyLimits?.remaininglimit || 400} /{" "}
                    {weeklyLimits?.totallimit || 400} seeds remaining this week.
                  </p>
                </div>
              )}

              {getGroupPrice !== null && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <span className="font-medium">Harga Kelompok:</span> $
                    {getGroupPrice} per seed
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="seedsSold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Seeds Sold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter number of seeds sold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricePerSeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Seed</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter price per seed"
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
                    "Submit Sale"
                  )}
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/sales-data">View Sales Data</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
