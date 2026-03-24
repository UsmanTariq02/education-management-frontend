"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { CalendarCheck2, Mail, MapPin, PhoneCall, Rocket, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { inquiriesApi } from "@/features/inquiries/api/inquiries-api";
import { contactInquirySchema, type ContactInquirySchema } from "@/features/inquiries/schemas/contact-inquiry-schema";
import { normalizeApiError } from "@/lib/api/errors";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/form-field";

const moduleOptions = ["Students", "Batches / classes", "Fees", "Attendance", "Reminders", "Reports"] as const;

export default function ContactPage() {
  const form = useForm<ContactInquirySchema>({
    resolver: zodResolver(contactInquirySchema),
    defaultValues: {
      fullName: "",
      email: "",
      institutionName: "",
      phone: "",
      institutionType: "School",
      expectedUserCount: "1-10",
      requestedModules: ["Students", "Fees", "Attendance"],
      inquiryType: "Product demo",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ContactInquirySchema) => inquiriesApi.createContactInquiry(values),
    onSuccess: () => {
      toast.success("Inquiry submitted. The team can now follow up with your rollout context.");
      form.reset({
        fullName: "",
        email: "",
        institutionName: "",
        phone: "",
        institutionType: "School",
        expectedUserCount: "1-10",
        requestedModules: ["Students", "Fees", "Attendance"],
        inquiryType: "Product demo",
        message: "",
      });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  return (
    <main className="container space-y-16 py-16">
      <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="space-y-6">
          <Badge>Contact</Badge>
          <PageHeader
            eyebrow="Sales, demos, and onboarding"
            title="Talk to the team that helps institutions turn operational chaos into one governed system."
            description="Use this page for product walkthroughs, pricing discussions, rollout planning, CSV migration conversations, and multi-organization onboarding."
          />
          <div className="grid gap-4">
            {[
              {
                title: "Email",
                value: "hello@eduflow.local",
                description: "Best for commercial questions, proposal requests, and product-fit discussions.",
                icon: Mail,
              },
              {
                title: "Phone",
                value: "+92 300 0000000",
                description: "Useful for direct implementation and stakeholder conversations.",
                icon: PhoneCall,
              },
              {
                title: "Coverage",
                value: "Schools, colleges, academies, education groups",
                description: "Single-campus and multi-tenant rollouts are both supported.",
                icon: MapPin,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="flex gap-4 p-5">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm">{item.value}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Quick pricing reminder</p>
              <p className="mt-2">
                Commercial estimates are based on <span className="font-semibold text-foreground">$1 per module per user</span>. If you share the
                expected number of users and the modules you need, the team can estimate your monthly SaaS footprint quickly.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Share your rollout context</CardTitle>
            <CardDescription>
              This form now captures a real inquiry record for demos, pricing discussions, implementation planning, migration questions, and multi-organization onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <FormField label="Full name" required error={form.formState.errors.fullName}>
                <Input {...form.register("fullName")} placeholder="Enter your name" />
              </FormField>
              <FormField label="Work email" required error={form.formState.errors.email}>
                <Input type="email" {...form.register("email")} placeholder="name@institution.edu" />
              </FormField>
              <FormField label="Institution name" required error={form.formState.errors.institutionName}>
                <Input {...form.register("institutionName")} placeholder="Green Valley College" />
              </FormField>
              <FormField label="Phone" error={form.formState.errors.phone}>
                <Input {...form.register("phone")} placeholder="+92..." />
              </FormField>
              <FormField label="Institution type" required error={form.formState.errors.institutionType}>
                <select className="h-10 rounded-xl border px-3 text-sm" {...form.register("institutionType")}>
                  <option>School</option>
                  <option>College</option>
                  <option>Academy</option>
                  <option>Training institute</option>
                  <option>Education group</option>
                </select>
              </FormField>
              <FormField label="Expected operational users" required error={form.formState.errors.expectedUserCount}>
                <select className="h-10 rounded-xl border px-3 text-sm" {...form.register("expectedUserCount")}>
                  <option>1-10</option>
                  <option>11-25</option>
                  <option>26-50</option>
                  <option>50+</option>
                </select>
              </FormField>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium">Required modules</p>
                <div className="grid gap-2 rounded-xl border p-4 sm:grid-cols-2">
                  {moduleOptions.map((module) => (
                    <label key={module} className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={form.watch("requestedModules").includes(module)}
                        onChange={(event) => {
                          const current = form.getValues("requestedModules");
                          form.setValue(
                            "requestedModules",
                            event.target.checked ? [...current, module] : current.filter((item) => item !== module),
                            { shouldDirty: true, shouldValidate: true },
                          );
                        }}
                      />
                      <span>{module}</span>
                    </label>
                  ))}
                </div>
                {form.formState.errors.requestedModules ? (
                  <p className="text-xs text-destructive">{form.formState.errors.requestedModules.message}</p>
                ) : null}
              </div>
              <FormField label="What do you need help with?" required error={form.formState.errors.inquiryType} className="md:col-span-2">
                <select className="h-10 rounded-xl border px-3 text-sm" {...form.register("inquiryType")}>
                  <option>Product demo</option>
                  <option>Pricing estimate</option>
                  <option>Implementation planning</option>
                  <option>Multi-tenant rollout</option>
                  <option>Migration from current system</option>
                </select>
              </FormField>
              <FormField label="Message" required error={form.formState.errors.message} className="md:col-span-2">
                <Textarea
                  rows={7}
                  {...form.register("message")}
                  placeholder="Tell us about your current student volume, number of campuses, fee process, attendance workflow, and the modules you want to launch first."
                />
              </FormField>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Submitting..." : "Submit inquiry"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Demo calls",
            description: "Best for schools or colleges evaluating how students, fees, attendance, reminders, and reports work together.",
            icon: CalendarCheck2,
          },
          {
            title: "Implementation planning",
            description: "Best when your team already knows the category and needs help sequencing onboarding and user access design.",
            icon: Rocket,
          },
          {
            title: "Multi-organization rollout",
            description: "Best for education groups that need platform-wide super-admin visibility across multiple institutions.",
            icon: UsersRound,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section>
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-primary">Helpful before the call</p>
              <h2 className="text-3xl font-semibold">Bring your expected user count, required modules, and current operational pain points.</h2>
              <p className="text-sm text-muted-foreground">
                That is usually enough to structure the right product discussion and give a realistic pricing estimate.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/pricing">Review pricing model</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/about">Read platform overview</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
