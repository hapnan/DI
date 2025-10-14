"use client";

import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { SectionLoading } from "~/components/ui/loading";
import { MdArrowBackIosNew } from "react-icons/md";
import { useSession } from "~/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getUserRole } from "~/lib/session-utils";
import type { UserRole } from "~/types/auth";

const roleColors: Record<UserRole, string> = {
  Raden: "bg-purple-500 text-white",
  Ultra: "bg-blue-500 text-white",
  Ijo: "bg-green-500 text-white",
  Abu: "bg-gray-500 text-white",
};

const roleDescriptions: Record<UserRole, string> = {
  Raden: "Administrator - Full system access",
  Ultra: "Manager - Full data access",
  Ijo: "User - Create and edit own data",
  Abu: "Read-only - View data only",
};

export default function UsersManagementPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const userRole = getUserRole(session);

  // Redirect if not Raden
  if (!sessionLoading && userRole !== "Raden") {
    router.push("/");
    return null;
  }

  const { data: users, isLoading: usersLoading } = api.user.getAll.useQuery();
  const { data: stats } = api.user.getStats.useQuery();

  const utils = api.useUtils();
  const updateRoleMutation = api.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully!");
      void utils.user.getAll.invalidate();
      void utils.user.getStats.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to update user role");
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({
      userId,
      newRole: newRole as UserRole,
    });
  };

  if (sessionLoading || usersLoading) {
    return <SectionLoading />;
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
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Administrators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byRole.Raden}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byRole.Ultra}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byRole.Ijo + stats.byRole.Abu}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => {
                const isSelf = user.id === session?.user?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isSelf && (
                        <Badge variant="outline" className="ml-2">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={roleColors[user.role as UserRole] ?? ""}
                      >
                        {user.role}
                      </Badge>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {roleDescriptions[user.role as UserRole]}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelf ? (
                        <span className="text-muted-foreground text-sm">
                          Cannot modify own role
                        </span>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value)
                          }
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Raden">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${roleColors.Raden}`}
                                />
                                Raden (Admin)
                              </div>
                            </SelectItem>
                            <SelectItem value="Ultra">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${roleColors.Ultra}`}
                                />
                                Ultra (Manager)
                              </div>
                            </SelectItem>
                            <SelectItem value="Ijo">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${roleColors.Ijo}`}
                                />
                                Ijo (User)
                              </div>
                            </SelectItem>
                            <SelectItem value="Abu">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${roleColors.Abu}`}
                                />
                                Abu (Read-only)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
