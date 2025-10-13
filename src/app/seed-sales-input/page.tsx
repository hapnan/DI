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
import { useSession } from "~/lib/auth-client";

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
});

type SeedSalesFormValues = z.infer<typeof seedSalesSchema>;

export default function SeedSalesInputPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: session } = useSession();

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
    },
  });

  const watchSeedsSold = form.watch("seedsSold");

  // Calculate price based on user role
  const getPriceInfo = () => {
    const role = (session?.user as any)?.role || "Abu";
    let pricePerSeed = 700;

    switch (role) {
      case "Abu":
        pricePerSeed = 100;
        break;
      case "Ijo":
        pricePerSeed = 200;
        break;
      case "Ultra":
      case "Raden":
        pricePerSeed = 700;
        break;
    }

    const seedsSold = Number(watchSeedsSold) || 0;
    const totalPrice = seedsSold * pricePerSeed;

    return { pricePerSeed, totalPrice, role };
  };

  const { pricePerSeed, totalPrice, role } = getPriceInfo();

  function onSubmit(values: SeedSalesFormValues) {
    createSale.mutate({
      memberId: parseInt(values.memberId),
      seedTypeId: parseInt(values.seedTypeId),
      seedsSold: parseInt(values.seedsSold),
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

              {/* Pricing Information Display */}
              <div className="bg-muted/50 space-y-2 rounded-md border p-4">
                <p className="text-sm font-medium">Pricing Information</p>
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>
                    Your Role:{" "}
                    <span className="text-foreground font-medium">{role}</span>
                  </p>
                  <p>
                    Price per Seed:{" "}
                    <span className="text-foreground font-medium">
                      Rp {pricePerSeed.toLocaleString()}
                    </span>
                  </p>
                  {watchSeedsSold && (
                    <p className="text-foreground pt-2 text-base font-semibold">
                      Total Price: Rp {totalPrice.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

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
                      Number of seeds sold to the member
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
