"use client";

import { useMemo, useState } from "react";
import { Calculator, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicModuleOptions } from "@/lib/marketing/module-catalog";

export function PricingCalculator() {
  const [userCount, setUserCount] = useState(15);
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "Student records",
    "Fee plans and collections",
    "Attendance",
    "Reports and analytics",
  ]);

  const monthlyEstimate = useMemo(() => userCount * selectedModules.length, [selectedModules.length, userCount]);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <Calculator className="h-5 w-5" />
        </div>
        <CardTitle>Interactive pricing calculator</CardTitle>
        <CardDescription>Use the live formula below to estimate monthly SaaS pricing for your institution.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium">Active users</label>
              <span className="text-muted-foreground">{userCount}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={userCount}
              onChange={(event) => setUserCount(Number(event.target.value))}
              className="w-full accent-[hsl(var(--primary))]"
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Selected modules</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {publicModuleOptions.map((module) => {
                const isSelected = selectedModules.includes(module);

                return (
                  <label key={module} className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => {
                        setSelectedModules((current) =>
                          event.target.checked ? [...current, module] : current.filter((item) => item !== module),
                        );
                      }}
                    />
                    <span>{module}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl bg-background p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Estimate</p>
          <p className="text-4xl font-semibold">${monthlyEstimate}/month</p>
          <p className="text-sm text-muted-foreground">
            Calculation: {userCount} active users x {selectedModules.length} modules x $1
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <p>Easy to explain to stakeholders and procurement teams.</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <p>Institutions can start small and expand later without switching platforms.</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <p>Works well for single-campus schools and multi-organization education groups.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
