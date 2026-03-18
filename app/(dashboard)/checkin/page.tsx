"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInForm } from "@/components/checkin/CheckInForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckInData {
  energy: number;
  focus: number;
  mood: number;
  note?: string | null;
}

export default function CheckInPage() {
  const [existing, setExisting] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/v1/checkins/today");
        if (res.ok) {
          const { data } = await res.json();
          setExisting(data);
        }
      } catch (err) {
        console.error("Failed to check existing check-in:", err);
      } finally {
        setLoading(false);
      }
    }

    checkExisting();
  }, []);

  async function handleSubmit(data: {
    energy: number;
    focus: number;
    mood: number;
    note?: string;
  }) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to submit check-in:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Already checked in — show read-only
  if (existing) {
    const labels: Record<number, string> = {
      1: "Low",
      2: "Below average",
      3: "Average",
      4: "Good",
      5: "High",
    };

    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Daily Check-in <span className="text-green-600">&#10003;</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              You&apos;ve already checked in today
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="font-medium">Energy</span>
              <span className="text-muted-foreground">
                {existing.energy}/5 — {labels[existing.energy]}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium">Focus</span>
              <span className="text-muted-foreground">
                {existing.focus}/5 — {labels[existing.focus]}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium">Mood</span>
              <span className="text-muted-foreground">
                {existing.mood}/5 — {labels[existing.mood]}
              </span>
            </div>
            {existing.note && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{existing.note}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <CheckInForm onSubmit={handleSubmit} isLoading={submitting} />
    </div>
  );
}
