"use client";

import { useEffect } from "react";
import { BadgeCheck, Building2, KeyRound, ShieldCheck } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { MetricCard } from "@/components/cards/metric-card";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { rolesApi } from "@/features/roles/api/roles-api";
import { usersApi } from "@/features/users/api/users-api";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.union([z.string().min(8, "Password must be at least 8 characters"), z.literal("")]).optional(),
});

type ProfileSchema = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshCurrentUser } = useAuth();
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["roles", "profile-page"],
    queryFn: rolesApi.list,
    enabled: Boolean(user),
  });

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
    });
  }, [form, user]);

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileSchema) => {
      if (!user) {
        throw new Error("Authenticated user not found");
      }

      const currentRoleIds =
        rolesQuery.data?.filter((role) => user.roles.includes(role.name)).map((role) => role.id) ?? [];

      return usersApi.update(user.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password || undefined,
        roleIds: currentRoleIds,
        isActive: true,
      });
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await refreshCurrentUser();
      queryClient.invalidateQueries({ queryKey: ["users"] });
      form.setValue("password", "");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (!user) {
    return <LoadingState rows={5} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Review your identity, access footprint, tenant context, and update the personal details attached to the current session."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Organization Scope"
          value={user.organizationName ?? "Platform"}
          helper={user.organizationId ? "Tenant-scoped workspace" : "Global super admin console"}
          icon={Building2}
          tone="sky"
        />
        <MetricCard
          title="Assigned Roles"
          value={String(user.roles.length)}
          helper="Role memberships attached to this user"
          icon={ShieldCheck}
          tone="violet"
        />
        <MetricCard
          title="Granted Permissions"
          value={String(user.permissions.length)}
          helper="Effective permissions in this session"
          icon={KeyRound}
          tone="amber"
        />
        <MetricCard
          title="Account Status"
          value="Active"
          helper="This session is currently eligible to access the platform"
          icon={BadgeCheck}
          tone="emerald"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>{`${user.firstName} ${user.lastName}`}</CardTitle>
            <CardDescription>Identity and access footprint for the current signed-in account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email ?? "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="font-medium">{user?.organizationName ?? "Platform scope"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Roles</p>
              <div className="flex flex-wrap gap-2">
                {user?.roles.map((role) => (
                  <Badge key={role}>{role}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {user?.permissions.map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              Profile updates preserve your current role assignment and tenant context. If you change your email or password, the account remains active under the same access footprint.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update profile</CardTitle>
            <CardDescription>Save your name, email, and password using the existing user update API.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
              <FormField label="First name" required error={form.formState.errors.firstName}>
                <Input {...form.register("firstName")} />
              </FormField>
              <FormField label="Last name" required error={form.formState.errors.lastName}>
                <Input {...form.register("lastName")} />
              </FormField>
              <FormField label="Email" required error={form.formState.errors.email} className="md:col-span-2">
                <Input type="email" {...form.register("email")} />
              </FormField>
              <FormField label="New password" error={form.formState.errors.password} className="md:col-span-2">
                <Input type="password" {...form.register("password")} placeholder="Leave blank to keep current password" />
              </FormField>
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-2">
                <p><span className="font-medium text-foreground">Last profile sync:</span> {formatDate(new Date())}</p>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending || rolesQuery.isLoading}>
                  {updateMutation.isPending ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Account guidance</CardTitle>
            <CardDescription>What this screen controls and what still remains administrative.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Editable here</p>
              <p className="mt-2">Name, login email, and password are user-owned profile settings and can be updated directly from this page.</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Managed by admins</p>
              <p className="mt-2">Roles, permissions, activation state, and tenant assignment remain administrative controls outside personal profile management.</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Recommended practice</p>
              <p className="mt-2">Use a unique email per operator and rotate passwords periodically, especially for super admin and finance-facing accounts.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
