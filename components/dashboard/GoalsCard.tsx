"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Check, X, Plus, Pause, Play } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface Goal {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

interface GoalsCardProps {
  goals: Goal[];
  onGoalsChanged: () => void;
}

export function GoalsCard({ goals, onGoalsChanged }: GoalsCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  // Auto-clear confirm delete after 3 seconds
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  async function handleAdd() {
    const title = newGoalValue.trim();
    if (!title) return;

    setLoadingId("new");
    try {
      const res = await fetch("/api/v1/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setNewGoalValue("");
        setIsAdding(false);
        onGoalsChanged();
      }
    } catch (err) {
      console.error("Failed to add goal:", err);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleEdit(goalId: string) {
    const title = editValue.trim();
    if (!title) return;

    setLoadingId(goalId);
    try {
      const res = await fetch(`/api/v1/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditValue("");
        onGoalsChanged();
      }
    } catch (err) {
      console.error("Failed to edit goal:", err);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleToggleActive(goal: Goal) {
    setLoadingId(goal.id);
    try {
      const res = await fetch(`/api/v1/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !goal.is_active }),
      });
      if (res.ok) onGoalsChanged();
    } catch (err) {
      console.error("Failed to toggle goal:", err);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(goalId: string) {
    if (confirmDeleteId !== goalId) {
      setConfirmDeleteId(goalId);
      return;
    }

    setLoadingId(goalId);
    try {
      const res = await fetch(`/api/v1/goals/${goalId}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDeleteId(null);
        onGoalsChanged();
      }
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      setLoadingId(null);
    }
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setEditValue(goal.title);
    setConfirmDeleteId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  function cancelAdd() {
    setIsAdding(false);
    setNewGoalValue("");
  }

  const activeGoals = goals.filter((g) => g.is_active);
  const inactiveGoals = goals.filter((g) => !g.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("goals.title")}</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              setConfirmDeleteId(null);
              setEditingId(null);
            }}
            disabled={isAdding || loadingId !== null}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("goals.addGoal")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {goals.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground">{t("goals.noGoals")}</p>
        )}

        <div className="space-y-2">
          {/* Add new goal input */}
          {isAdding && (
            <div className="flex items-center gap-2">
              <Input
                ref={addInputRef}
                value={newGoalValue}
                onChange={(e) => setNewGoalValue(e.target.value)}
                placeholder={t("goals.newGoalPlaceholder")}
                disabled={loadingId === "new"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") cancelAdd();
                }}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleAdd}
                disabled={loadingId === "new" || !newGoalValue.trim()}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelAdd} disabled={loadingId === "new"}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Active goals */}
          {activeGoals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-2 group">
              {editingId === goal.id ? (
                <>
                  <Input
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    disabled={loadingId === goal.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(goal.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(goal.id)}
                    disabled={loadingId === goal.id || !editValue.trim()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEdit} disabled={loadingId === goal.id}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{goal.title}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => startEdit(goal)}
                      disabled={loadingId !== null}
                      title={t("common.edit")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleToggleActive(goal)}
                      disabled={loadingId !== null}
                      title={t("goals.deactivate")}
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(goal.id)}
                      disabled={loadingId !== null}
                      title={confirmDeleteId === goal.id ? t("goals.confirmDelete") : t("common.delete")}
                    >
                      {confirmDeleteId === goal.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Inactive goals */}
          {inactiveGoals.length > 0 && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {inactiveGoals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 group opacity-50">
                  <span className="flex-1 text-sm line-through">{goal.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {t("goals.inactive")}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleToggleActive(goal)}
                      disabled={loadingId !== null}
                      title={t("goals.reactivate")}
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(goal.id)}
                      disabled={loadingId !== null}
                      title={confirmDeleteId === goal.id ? t("goals.confirmDelete") : t("common.delete")}
                    >
                      {confirmDeleteId === goal.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
