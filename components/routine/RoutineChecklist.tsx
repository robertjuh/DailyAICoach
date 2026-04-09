"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

interface RoutineItemData {
  id: string;
  name: string;
  duration_minutes: number;
  sort_order: number;
}

interface RoutineChecklistProps {
  items: RoutineItemData[];
  completedIds: Set<string>;
  onToggle: (itemId: string) => void;
}

export function RoutineChecklist({
  items,
  completedIds,
  onToggle,
}: RoutineChecklistProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { t } = useLocale();

  const handleToggle = useCallback(
    async (itemId: string) => {
      if (completedIds.has(itemId)) return; // Already completed
      setLoading(itemId);
      onToggle(itemId);
      setLoading(null);
    },
    [completedIds, onToggle]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("dashboard.morningRoutine")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const isCompleted = completedIds.has(item.id);
          const isLoading = loading === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id)}
              disabled={isCompleted || isLoading}
              className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${
                isCompleted
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border hover:border-primary/30"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isCompleted
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {isCompleted && (
                  <svg
                    className="w-3.5 h-3.5 text-primary-foreground"
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

              {/* Item info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isCompleted ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.duration_minutes} min
                </p>
              </div>

              {isLoading && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
