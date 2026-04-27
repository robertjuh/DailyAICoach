"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { TodayProgress } from "@/components/dashboard/TodayProgress";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { RoutineChecklist } from "@/components/routine/RoutineChecklist";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

interface RoutineItem {
  id: string;
  name: string;
  duration_minutes: number;
  sort_order: number;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [goals, setGoals] = useState<{ id: string; title: string; is_active: boolean; created_at: string }[]>([]);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const todayDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [userRes, logsRes, streakRes, checkinRes, goalsRes] =
          await Promise.all([
            fetch("/api/v1/users/me"),
            //fetch("/api/v1/routines/active"),
            fetch(`/api/v1/logs?date=${todayDate}`),
            fetch("/api/v1/progress/streak"),
            fetch("/api/v1/checkins/today"),
            fetch("/api/v1/goals"),
          ]);

        if (userRes.ok) {
          const { data } = await userRes.json();
          setUserName(data.name || "there");
        }

        // if (routineRes.ok) {
        //   const { data } = await routineRes.json();
        //   setItems(data.items || []);
        // }

        if (logsRes.ok) {
          const { data } = await logsRes.json();
          const ids = new Set<string>(
            (data as { routine_item_id: string }[]).map(
              (l: { routine_item_id: string }) => l.routine_item_id
            )
          );
          setCompletedIds(ids);
        }

        if (streakRes.ok) {
          const { data } = await streakRes.json();
          setStreak(data.streak);
        }

        if (checkinRes.ok) {
          const { data } = await checkinRes.json();
          setHasCheckedIn(data !== null);
        }

        if (goalsRes.ok) {
          const { data } = await goalsRes.json();
          setGoals(data || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [todayDate]);

  const handleGoalsChanged = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/goals");
      if (res.ok) {
        const { data } = await res.json();
        setGoals(data || []);
      }
    } catch (err) {
      console.error("Failed to refresh goals:", err);
    }
  }, []);

  const handleToggle = useCallback(
    async (itemId: string) => {
      // Optimistic update
      setCompletedIds((prev) => new Set([...prev, itemId]));

      try {
        const res = await fetch("/api/v1/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            routine_item_id: itemId,
            date: todayDate,
          }),
        });

        if (!res.ok) {
          // Revert on error
          setCompletedIds((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        }
      } catch {
        // Revert on error
        setCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    },
    [todayDate]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t("dashboard.goodMorning") : hour < 18 ? t("dashboard.goodAfternoon") : t("dashboard.goodEvening");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, {userName}
        </h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <TodayProgress completed={completedIds.size} total={items.length} />
        <StreakCard streak={streak} />
      </div> */}

      <GoalsCard goals={goals} onGoalsChanged={handleGoalsChanged} />

      {/* <RoutineChecklist
        items={items}
        completedIds={completedIds}
        onToggle={handleToggle}
      /> */}

      {/* {!hasCheckedIn && (
        <Link href="/checkin">
          <Button variant="outline" className="w-full">
            {t("dashboard.completeCheckin")}
          </Button>
        </Link>
      )} */}
    </div>
  );
}
