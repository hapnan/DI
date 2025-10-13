"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Link, Loader2 } from "lucide-react";
import * as React from "react";
import { MdArrowBackIosNew } from "react-icons/md";

const leafPurchaseSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  leafTypeId: z.string().min(1, "Please select a leaf type"),
  leavesPurchased: z
    .string()
    .min(1, "Leaves purchased is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Leaves purchased must be a non-negative number",
    ),
  costPerLeaf: z.string().optional(),
  totalCost: z.string().optional(),
});

type LeafPurchaseFormValues = z.infer<typeof leafPurchaseSchema>;

export default function LeafPurchaseInputPage() {
  const router = useRouter();
  const utils = api.useUtils();

  // Fetch all members
  const { data: members, isLoading: membersLoading } =
    api.members.getAll.useQuery();

  // Fetch all leaf types
  const { data: leafTypes, isLoading: leafTypesLoading } =
    api.leafType.getAll.useQuery();

  // Create leaf purchase mutation
  const createLeafPurchase = api.internalLeaf.create.useMutation({
    onSuccess: () => {
      toast.success("Leaf purchase recorded successfully!");
      form.reset();
      void utils.internalLeaf.getAll.invalidate();
      router.push("/sales-data");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record leaf purchase");
    },
  });

  const form = useForm<LeafPurchaseFormValues>({
    resolver: zodResolver(leafPurchaseSchema),
    defaultValues: {
      memberId: "",
      leafTypeId: "1",
      leavesPurchased: "",
      costPerLeaf: "200",
      totalCost: "",
    },
  });

  // Calculate total cost when leaves purchased or cost per leaf changes
  const watchLeavesPurchased = form.watch("leavesPurchased");
  const watchCostPerLeaf = form.watch("costPerLeaf");

  React.useEffect(() => {
    if (watchLeavesPurchased && watchCostPerLeaf) {
      const total = Number(watchLeavesPurchased) * Number(watchCostPerLeaf);
      if (!isNaN(total)) {
        form.setValue("totalCost", total.toString());
      }
    }
  }, [watchLeavesPurchased, watchCostPerLeaf, form]);

  function onSubmit(values: LeafPurchaseFormValues) {
    createLeafPurchase.mutate({
      memberId: Number(values.memberId),
      leafTypeId: Number(values.leafTypeId),
      leavesPurchased: Number(values.leavesPurchased),
      costPerLeaf: values.costPerLeaf ? Number(values.costPerLeaf) : 200,
      totalCost: values.totalCost ? Number(values.totalCost) : 0,
    });
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
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Record Leaf Purchase</CardTitle>
          <CardDescription>
            Enter the details of leaf purchases for internal tracking
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
                          <SelectValue placeholder="Select a member" />
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
                      Select the member selling leaves
                    </FormDescription>
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={leafTypesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leaf type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leafTypes?.map((leafType) => (
                          <SelectItem
                            key={leafType.id}
                            value={leafType.id.toString()}
                          >
                            {leafType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of leaf being purchased
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leavesPurchased"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leaves Purchased</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number of leaves purchased"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of leaves purchased from the group
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPerLeaf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Leaf</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter cost per leaf"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Default is 200 per leaf</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Calculated automatically"
                        {...field}
                        readOnly
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormDescription>
                      Automatically calculated based on leaves purchased and
                      cost per leaf
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createLeafPurchase.isPending}
                  className="flex-1"
                >
                  {createLeafPurchase.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Purchase
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
