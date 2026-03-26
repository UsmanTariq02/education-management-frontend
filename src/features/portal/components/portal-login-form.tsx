"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { portalAuthApi } from "@/features/portal/api/portal-auth-api";
import { normalizeApiError } from "@/lib/api/errors";
import { usePortalAuth } from "@/providers/portal-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortalAccountType } from "@/types/auth";

export function PortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect");
  const { setSession } = usePortalAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<PortalAccountType>("STUDENT");

  const mutation = useMutation({
    mutationFn: portalAuthApi.login,
    onSuccess: (response) => {
      setSession(response);
      const fallback = response.user.accountType === "PARENT" ? "/portal/parent" : "/portal/student";
      router.replace(redirect || fallback);
      toast.success("Portal access granted");
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Portal sign in</CardTitle>
        <CardDescription>Access student or parent updates with your portal credentials.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ email, password, accountType });
          }}
        >
          <div className="grid gap-2">
            <Label>Portal type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={accountType === "STUDENT" ? "default" : "outline"} onClick={() => setAccountType("STUDENT")}>
                Student
              </Button>
              <Button type="button" variant={accountType === "PARENT" ? "default" : "outline"} onClick={() => setAccountType("PARENT")}>
                Parent
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="portal-email">Email</Label>
            <Input id="portal-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@school.edu" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="portal-password">Password</Label>
            <Input id="portal-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in..." : "Enter portal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
