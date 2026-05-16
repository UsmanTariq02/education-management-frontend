"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { loginSchema, type LoginSchema } from "@/features/auth/schemas/login-schema";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/dashboard";
  const { setSession } = useAuth();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      setSession(response);
      toast.success("Welcome back");
      router.replace(redirect);
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      toast.error(normalized.message);
      form.setError("root", { message: normalized.message });
    },
  });

  return (
    <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-xl shadow-slate-900/5 backdrop-blur">
      <CardHeader>
        <div className="mb-2 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Sign in
        </div>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your organization credentials to access the operations console.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <FormField label="Email" required error={form.formState.errors.email}>
            <Input type="email" {...form.register("email")} placeholder="admin@school.edu" />
          </FormField>
          <FormField label="Password" required error={form.formState.errors.password}>
            <Input type="password" {...form.register("password")} placeholder="••••••••" />
          </FormField>
          {form.formState.errors.root ? <p className="text-sm text-destructive">{form.formState.errors.root.message}</p> : null}
          <Button type="submit" className="w-full shadow-sm shadow-primary/15" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
