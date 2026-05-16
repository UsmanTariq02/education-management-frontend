"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studentsApi } from "@/features/students/api/students-api";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function StudentPortalAccessCard({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["student-portal-access", studentId],
    queryFn: () => studentsApi.portalAccess(studentId),
    enabled: Boolean(studentId),
  });

  const [studentPassword, setStudentPassword] = useState("");
  const [parentPassword, setParentPassword] = useState("");

  useEffect(() => {
    if (query.data) {
      setStudentPassword("");
      setParentPassword("");
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: studentsApi.upsertPortalAccess,
    onSuccess: () => {
      toast.success("Portal access updated");
      void queryClient.invalidateQueries({ queryKey: ["student-portal-access", studentId] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (!query.data) {
    return null;
  }

  const { studentAccount, parentAccount, studentEmail, guardianEmail } = query.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portal access</CardTitle>
        <CardDescription>Provision or reset student and parent portal credentials from the academic dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <PortalAccessBlock
          title="Student portal"
          email={studentEmail}
          account={studentAccount}
          password={studentPassword}
          onPasswordChange={setStudentPassword}
          onActivate={() => mutation.mutate({ id: studentId, payload: { studentEnabled: true, studentPassword: studentPassword || undefined } })}
          onDeactivate={() => mutation.mutate({ id: studentId, payload: { studentEnabled: false } })}
          onReset={() => mutation.mutate({ id: studentId, payload: { studentPassword } })}
          isPending={mutation.isPending}
        />
        <PortalAccessBlock
          title="Parent portal"
          email={guardianEmail}
          account={parentAccount}
          password={parentPassword}
          onPasswordChange={setParentPassword}
          onActivate={() => mutation.mutate({ id: studentId, payload: { parentEnabled: true, parentPassword: parentPassword || undefined } })}
          onDeactivate={() => mutation.mutate({ id: studentId, payload: { parentEnabled: false } })}
          onReset={() => mutation.mutate({ id: studentId, payload: { parentPassword } })}
          isPending={mutation.isPending}
        />
      </CardContent>
    </Card>
  );
}

function PortalAccessBlock({
  title,
  email,
  account,
  password,
  onPasswordChange,
  onActivate,
  onDeactivate,
  onReset,
  isPending,
}: {
  title: string;
  email: string | null;
  account: { email: string; isActive: boolean; lastLoginAt: string | null } | null;
  password: string;
  onPasswordChange: (value: string) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onReset: () => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
      <div className="space-y-2">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{email ?? "Email is required before this portal can be activated."}</p>
        <p className="text-sm text-muted-foreground">
          {account ? `Status: ${account.isActive ? "Active" : "Inactive"} · Last login: ${formatDate(account.lastLoginAt, "MMM d, yyyy p")}` : "Not provisioned yet"}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <Input value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Set or reset password" type="password" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onActivate} disabled={isPending || !email}>
            {account ? "Enable / Update" : "Create access"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onReset} disabled={isPending || !account || !password}>
            Reset password
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDeactivate} disabled={isPending || !account}>
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
}
