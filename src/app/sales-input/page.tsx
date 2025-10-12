"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { set, z } from "zod";
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
  seedsSold: z.string().min(1, "Please enter number of seeds sold"),
  pricePerSeed: z.string().min(1, "Please enter price per seed").optional(),
  totalPrice: z.string().min(1, "Please enter total price"),
});

export default function SalesInputPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { data: weeklyLimits } = api.weeklyLimit.getCurrentLimit.useQuery(
    { groupId: selectedGroupId! },
    { enabled: !!selectedGroupId },
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupId: "",
      seedsSold: "",
      pricePerSeed: "700",
      totalPrice: "",
    },
  });

  // Get all groups for the select dropdown
  const { data: groups, isLoading: groupsLoading } =
    api.group.getAll.useQuery();

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
        seedsSold: parseInt(values.seedsSold),
        totalPrice: parseInt(values.totalPrice),
        pricePerSeed:
          Math.round(
            parseInt(values.totalPrice) / parseInt(values.seedsSold),
          ) || 700,
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
              {weeklyLimits && (
                <div className="rounded-md border p-4">
                  <p className="text-sm">
                    <span className="font-medium">Weekly Limit:</span>{" "}
                    {weeklyLimits?.remaininglimit || 400} /{" "}
                    {weeklyLimits?.totallimit || 400} seeds remaining this week.
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
