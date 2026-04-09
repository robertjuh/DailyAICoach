"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n/locale-context";

interface TodayProgressProps {
  completed: number;
  total: number;
}

export function TodayProgress({ completed, total }: TodayProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const { t } = useLocale();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">{t("dashboard.todaysProgress")}</p>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.completedOf", { completed: String(completed), total: String(total) })}
          </p>
        </div>
        <Progress value={percentage} className="h-2" />
      </CardContent>
    </Card>
  );
}
