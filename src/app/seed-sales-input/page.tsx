"use client";
import * as React from "react";
import { MdArrowBackIosNew } from "react-icons/md";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const seedSalesSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  seedTypeId: z.string().min(1, "Please select a seed type"),
  seedsSold: z
    .string()
    .min(1, "Seeds sold is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Seeds sold must be a positive number",
    ),
  pricePerSeed: z.string(),
  totalPrice: z.string(),
});

type SeedSalesFormValues = z.infer<typeof seedSalesSchema>;

export default function SeedSalesInputPage() {
  const router = useRouter();
  const utils = api.useUtils();

  // Fetch all members
  const { data: members, isLoading: membersLoading } =
    api.members.getAll.useQuery();

  // Fetch all seed types
  const { data: seedTypes, isLoading: seedTypesLoading } =
    api.seedType.getAll.useQuery();

  // Create sale mutation
  const createSale = api.internalSeed.create.useMutation({
    onSuccess: () => {
      toast.success("Seed sale recorded successfully!");
      void utils.internalSeed.getAll.invalidate();
      form.reset();
      router.push("/sales-data");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record seed sale");
    },
  });

  const form = useForm<SeedSalesFormValues>({
    resolver: zodResolver(seedSalesSchema),
    defaultValues: {
      memberId: "",
      seedTypeId: "1",
      seedsSold: "",
      totalPrice: "",
      pricePerSeed: "700",
    },
  });

  // Calculate total price when seeds sold or price per seed changes
  const watchPricePerSeed = form.watch("pricePerSeed");
  const watchSeedsSold = form.watch("seedsSold");

  React.useEffect(() => {
    if (watchSeedsSold && watchPricePerSeed) {
      const total = Number(watchPricePerSeed) * Number(watchSeedsSold);
      if (!isNaN(total)) {
        form.setValue("totalPrice", total.toString());
      }
    }
  }, [watchSeedsSold, watchPricePerSeed, form]);

  function onSubmit(values: SeedSalesFormValues) {
    createSale.mutate({
      memberId: parseInt(values.memberId),
      seedTypeId: parseInt(values.seedTypeId),
      seedsSold: parseInt(values.seedsSold),
      pricePerSeed: Math.round(
        parseInt(values.totalPrice) / parseInt(values.seedsSold),
      ),
      totalPrice: parseInt(values.totalPrice),
    });
  }

  return (
    <div className="container mx-auto max-w-lg py-8">
      <div className="flex">
        <Button variant="ghost" asChild>
          <Link href="/">
            <MdArrowBackIosNew /> Back to Home
          </Link>
        </Button>
      </div>
      <Card className="mt-2 max-w-2xl">
        <CardHeader>
          <CardTitle>Record Seed Sales</CardTitle>
          <CardDescription>
            Enter the details of seed sales for internal tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={membersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members?.map((member) => (
                          <SelectItem
                            key={member.id}
                            value={member.id.toString()}
                          >
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the group purchasing seeds
                    </FormDescription>
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={seedTypesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select seed type" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormDescription>
                      Select the type of seed being sold
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seedsSold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seeds Sold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number of seeds sold"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of seeds sold to the group
                    </FormDescription>
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
                        placeholder="Calculated automatically"
                        {...field}
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormDescription>
                      Automatically calculated based on seeds sold and total
                      price
                    </FormDescription>
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
                        placeholder="Price"
                        {...field}
                        readOnly
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormDescription>
                      Automatically calculated based on seeds sold and price per
                      seed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createSale.isPending}
                  className="flex-1"
                >
                  {createSale.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Sale
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/sales-data")}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
