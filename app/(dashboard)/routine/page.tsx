"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoutineItem {
  id: string;
  name: string;
  duration_minutes: number;
  sort_order: number;
  is_active: boolean;
}

interface Routine {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  items: RoutineItem[];
}

export default function RoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoutines() {
      try {
        const res = await fetch("/api/v1/routines");
        if (res.ok) {
          const { data } = await res.json();
          setRoutines(data);
        }
      } catch (err) {
        console.error("Failed to load routines:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRoutines();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">My Routines</h1>

      {routines.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No routines yet. Complete onboarding to get started!
          </CardContent>
        </Card>
      ) : (
        routines.map((routine) => (
          <Card key={routine.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{routine.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">{routine.type}</Badge>
                  {routine.is_active && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {routine.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.duration_minutes} min
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Total:{" "}
                {routine.items.reduce(
                  (sum, i) => sum + i.duration_minutes,
                  0
                )}{" "}
                minutes
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
