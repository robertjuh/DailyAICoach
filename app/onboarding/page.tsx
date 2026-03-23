"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sun, Moon, Anchor } from "lucide-react";

const DAY_TYPES = [
  { value: "build", label: "Build", desc: "Creating something new" },
  { value: "finish", label: "Finish", desc: "Completing what's in progress" },
  { value: "ship", label: "Ship", desc: "Pushing things out the door" },
  { value: "recover", label: "Recover", desc: "Resting and resetting" },
  { value: "stabilize", label: "Stabilize", desc: "Maintaining and organizing" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [goals, setGoals] = useState(["", "", ""]);
  const [workDescription, setWorkDescription] = useState("");
  const [defaultDayType, setDefaultDayType] = useState("build");
  const [firstWatchTime, setFirstWatchTime] = useState("07:00");
  const [nightWatchTime, setNightWatchTime] = useState("21:00");
  const [movementPreference, setMovementPreference] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const filledGoals = goals.filter((g) => g.trim().length > 0);

  function canProceed() {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return filledGoals.length >= 1;
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
          name: name.trim(),
          timezone,
          goals: filledGoals,
          work_description: workDescription.trim() || undefined,
          default_day_type: defaultDayType,
          first_watch_time: firstWatchTime,
          night_watch_time: nightWatchTime,
          movement_preference: movementPreference.trim() || undefined,
          notify_enabled: notifyEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        let msg = data.error || "Something went wrong";
        if (data.details?.fieldErrors) {
          const fields = Object.entries(data.details.fieldErrors)
            .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
            .join("; ");
          if (fields) msg += ` (${fields})`;
        }
        setError(msg);
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
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome Aboard */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <Anchor className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle className="text-2xl">Welcome aboard.</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                The goal isn&apos;t heroic days. It&apos;s perfect average days
                you can repeat, that compound over months.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Watch system intro */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border text-center space-y-1">
                  <Sun className="h-6 w-6 text-amber-500 mx-auto" />
                  <p className="text-sm font-medium">First Watch</p>
                  <p className="text-xs text-muted-foreground">
                    Morning orientation — set your bearing
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border text-center space-y-1">
                  <Moon className="h-6 w-6 text-indigo-400 mx-auto" />
                  <p className="text-sm font-medium">Night Watch</p>
                  <p className="text-xs text-muted-foreground">
                    Evening reflection — close the day
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center italic">
                Each night feeds into the next morning. Each day builds on the
                last.
              </p>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">What should we call you?</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">Your timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. Europe/Amsterdam"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-detected. Change if incorrect.
                </p>
              </div>

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

        {/* Step 2: Chart Your Course */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Chart your course</CardTitle>
              <p className="text-sm text-muted-foreground">
                What are you steering toward? These shape your daily watches.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Goals */}
              <div className="space-y-3">
                <Label>Your goals (at least 1)</Label>
                {goals.map((goal, i) => (
                  <Input
                    key={i}
                    value={goal}
                    onChange={(e) => {
                      const updated = [...goals];
                      updated[i] = e.target.value;
                      setGoals(updated);
                    }}
                    placeholder={
                      [
                        "Ship my side project",
                        "Build a writing habit",
                        "Recover consistent sleep",
                      ][i]
                    }
                  />
                ))}
              </div>

              {/* Work description */}
              <div className="space-y-2">
                <Label htmlFor="work">
                  What does your typical workday involve?
                </Label>
                <Textarea
                  id="work"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="e.g. Software engineering at a startup, freelance writing + parenting"
                  rows={2}
                />
              </div>

              {/* Day type */}
              <div className="space-y-2">
                <Label>Most days, how would you describe your rhythm?</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_TYPES.map((dt) => (
                    <Button
                      key={dt.value}
                      size="sm"
                      variant={
                        defaultDayType === dt.value ? "default" : "outline"
                      }
                      onClick={() => setDefaultDayType(dt.value)}
                      title={dt.desc}
                    >
                      {dt.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {DAY_TYPES.find((d) => d.value === defaultDayType)?.desc}
                </p>
              </div>

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

        {/* Step 3: Set Your Watch Times */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Set your watch times</CardTitle>
              <p className="text-sm text-muted-foreground">
                When do you want to check in with yourself?
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Watch times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    First Watch
                  </Label>
                  <input
                    type="time"
                    value={firstWatchTime}
                    onChange={(e) => setFirstWatchTime(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    Night Watch
                  </Label>
                  <input
                    type="time"
                    value={nightWatchTime}
                    onChange={(e) => setNightWatchTime(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your AI coach will have drafts ready at these times. About 10-15
                minutes each.
              </p>

              {/* Movement */}
              <div className="space-y-2">
                <Label htmlFor="movement">How do you like to move?</Label>
                <Textarea
                  id="movement"
                  value={movementPreference}
                  onChange={(e) => setMovementPreference(e.target.value)}
                  placeholder="e.g. Morning walk, gym 3x/week, yoga when I can"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Movement appears in both watches — this helps your coach
                  suggest something real, not generic.
                </p>
              </div>

              {/* Notifications */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEnabled}
                  onChange={(e) => setNotifyEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">
                  Remind me when it&apos;s time for my watch
                </span>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Your First Bearing */}
        {step === 4 && (
          <Card>
            <CardHeader className="text-center">
              <Anchor className="h-8 w-8 text-primary mx-auto mb-1" />
              <CardTitle>Your first bearing</CardTitle>
              <p className="text-sm text-muted-foreground">
                Here&apos;s what we know. Your AI coach will use this to
                generate your daily watches.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Summary */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Timezone</span>
                  <span className="font-medium">{timezone}</span>
                </div>

                <div className="py-2 border-b">
                  <span className="text-muted-foreground">Goals</span>
                  <ul className="mt-1 space-y-1">
                    {filledGoals.map((g, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-primary">&#10003;</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>

                {workDescription && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Work</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {workDescription}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Day rhythm</span>
                  <span className="font-medium capitalize">
                    {defaultDayType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>{firstWatchTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    <span>{nightWatchTime}</span>
                  </div>
                </div>

                {movementPreference && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Movement</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {movementPreference}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground italic">
                Your anchor is set. Tomorrow morning, your First Watch will be
                waiting.
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Setting sail..." : "Begin the voyage"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
