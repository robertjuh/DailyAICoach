"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoutineBuilder } from "@/components/routine/RoutineBuilder";

interface RoutineItemData {
  name: string;
  duration_minutes: number;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [goals, setGoals] = useState(["", "", ""]);
  const [routineItems, setRoutineItems] = useState<RoutineItemData[]>([
    { name: "", duration_minutes: 0 },
    { name: "", duration_minutes: 0 },
    { name: "", duration_minutes: 0 },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const filledGoals = goals.filter((g) => g.trim().length > 0);
  const filledItems = routineItems.filter(
    (i) => i.name.trim().length > 0 && i.duration_minutes > 0
  );

  function canProceed() {
    if (step === 1) return filledGoals.length >= 1;
    if (step === 2) return filledItems.length >= 1;
    return true;
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User", // Will be updated from auth metadata
          goals: filledGoals,
          routine_items: filledItems,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Goals */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>What do you want to achieve?</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set up to 3 long-term goals. At least 1 is required.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal, i) => (
                <div key={i} className="space-y-1">
                  <Label>Goal {i + 1}</Label>
                  <Input
                    value={goal}
                    onChange={(e) => {
                      const updated = [...goals];
                      updated[i] = e.target.value;
                      setGoals(updated);
                    }}
                    placeholder={
                      ["Learn piano", "Get fit", "Build a business"][i]
                    }
                  />
                </div>
              ))}

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="w-full"
              >
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Morning Routine */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>
                What does your ideal morning look like?
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add 3 things you want to do every morning
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <RoutineBuilder items={routineItems} onChange={setRoutineItems} />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Your plan looks great!</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review and confirm to get started
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Your Goals</h3>
                <ul className="space-y-1">
                  {filledGoals.map((goal, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-primary">&#10003;</span> {goal}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Morning Routine</h3>
                <ul className="space-y-1">
                  {filledItems.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-primary">&#10003;</span>{" "}
                      {item.name} ({item.duration_minutes} min)
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Setting up..." : "Start my routine →"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
