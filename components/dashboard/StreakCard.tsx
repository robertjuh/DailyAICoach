"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  const { t } = useLocale();

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="text-4xl">🔥</div>
        <div>
          <p className="text-3xl font-bold">{streak}</p>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.dayStreak")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
