"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  InlineLoading,
  SectionLoading,
  ButtonLoading,
} from "~/components/ui/loading";

import { api } from "~/trpc/react";
import { MdArrowBackIosNew } from "react-icons/md";

export default function SetupPage() {
  const [groupName, setGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all groups
  const {
    data: groups,
    refetch,
    isLoading: groupsLoading,
  } = api.group.getAll.useQuery();

  // Create group mutation
  const createGroup = api.group.create.useMutation({
    onSuccess: () => {
      setGroupName("");
      setIsSubmitting(false);
      void refetch();
    },
    onError: (error) => {
      console.error("Error creating group:", error);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    try {
      await createGroup.mutateAsync({ name: groupName.trim() });
    } catch (error) {
      console.error("Submit error:", error);
      setIsSubmitting(false);
    }
  };

  const createSampleGroups = async () => {
    const sampleGroups = [
      "Tomato Seeds",
      "Lettuce Seeds",
      "Carrot Seeds",
      "Bean Seeds",
      "Sunflower Seeds",
    ];

    setIsSubmitting(true);
    try {
      for (const groupName of sampleGroups) {
        await createGroup.mutateAsync({ name: groupName });
      }
    } catch (error) {
      console.error("Error creating sample groups:", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="flex">
        <Button variant="ghost" asChild>
          <Link href="/">
            <MdArrowBackIosNew /> Back to Home
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Setup Groups</CardTitle>
          <CardDescription>
            Create seed groups before recording sales data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create sample groups */}
          <div>
            <Label className="text-base font-medium">Quick Setup</Label>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Create some common seed groups to get started quickly
            </p>
            <Button
              onClick={createSampleGroups}
              disabled={isSubmitting}
              variant="outline"
              className="w-full"
            >
              {isSubmitting ? (
                <ButtonLoading text="Creating..." />
              ) : (
                "Create Sample Groups"
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Or create custom groups
              </span>
            </div>
          </div>

          {/* Create custom group */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name (e.g., Tomato Seeds)"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                disabled={!groupName.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <ButtonLoading text="Creating..." />
                ) : (
                  "Create Group"
                )}
              </Button>
            </div>
          </form>

          {/* Existing groups */}
          <div>
            <Label className="text-base font-medium">Existing Groups</Label>
            {groupsLoading ? (
              <SectionLoading text="Loading groups..." />
            ) : groups && groups.length > 0 ? (
              <div className="mt-3 space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <span>{group.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-200">
                      ID: {group.id}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mt-3 text-sm">
                No groups created yet. Create your first group above.
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/sales-input">Go to Sales Input</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
