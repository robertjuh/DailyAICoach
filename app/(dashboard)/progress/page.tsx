"use client";

import { useEffect, useState } from "react";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

interface DayData {
  date: string;
  completed: boolean;
}

interface WeeklyItem {
  id: string;
  name: string;
  days: DayData[];
}

export default function ProgressPage() {
  const [streak, setStreak] = useState(0);
  const [items, setItems] = useState<WeeklyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    async function loadProgress() {
      try {
        const [streakRes, weeklyRes] = await Promise.all([
          fetch("/api/v1/progress/streak"),
          fetch("/api/v1/progress/weekly"),
        ]);

        if (streakRes.ok) {
          const { data } = await streakRes.json();
          setStreak(data.streak);
        }

        if (weeklyRes.ok) {
          const { data } = await weeklyRes.json();
          setItems(data.items);
        }
      } catch (err) {
        console.error("Failed to load progress:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Day labels for the weekly view
  const dayLabels = items[0]?.days.map((d) => {
    const date = new Date(d.date + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
  }) ?? [];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("progress.title")}</h1>

      <StreakCard streak={streak} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("progress.sevenDayConsistency")}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("progress.noItems")}
            </p>
          ) : (
            <div className="space-y-4">
              {/* Day labels row */}
              <div className="flex items-center">
                <div className="w-28 shrink-0" />
                <div className="flex-1 flex justify-between px-1">
                  {dayLabels.map((label, i) => (
                    <span
                      key={i}
                      className="text-xs text-muted-foreground w-8 text-center"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Item rows */}
              {items.map((item) => (
                <div key={item.id} className="flex items-center">
                  <div className="w-28 shrink-0">
                    <p className="text-sm truncate">{item.name}</p>
                  </div>
                  <div className="flex-1 flex justify-between px-1">
                    {item.days.map((day) => (
                      <div
                        key={day.date}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          day.completed
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {day.completed && (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
