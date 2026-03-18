"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="text-4xl">🔥</div>
        <div>
          <p className="text-3xl font-bold">{streak}</p>
          <p className="text-sm text-muted-foreground">
            {streak === 1 ? "day streak" : "day streak"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
