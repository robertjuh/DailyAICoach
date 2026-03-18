"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Sparkles, Loader2 } from "lucide-react";

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

interface EditItem {
  name: string;
  duration_minutes: number;
  sort_order: number;
}

export default function RoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    loadRoutines();
  }, []);

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

  function startEditing(routine: Routine) {
    setEditingId(routine.id);
    setEditName(routine.name);
    setEditItems(
      routine.items.map((item) => ({
        name: item.name,
        duration_minutes: item.duration_minutes,
        sort_order: item.sort_order,
      }))
    );
  }

  function cancelEditing() {
    setEditingId(null);
    setEditItems([]);
    setEditName("");
    setAiSuggestions([]);
  }

  async function saveRoutine(routineId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/routines/${routineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          items: editItems.filter((i) => i.name.trim()),
        }),
      });

      if (res.ok) {
        setEditingId(null);
        await loadRoutines();
      }
    } catch (err) {
      console.error("Failed to save routine:", err);
    } finally {
      setSaving(false);
    }
  }

  function addItem() {
    setEditItems((prev) => [
      ...prev,
      { name: "", duration_minutes: 10, sort_order: prev.length },
    ]);
  }

  function removeItem(index: number) {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  }

  const fetchAiSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch("/api/v1/chat/suggestions");
      if (res.ok) {
        const { data } = await res.json();
        setAiSuggestions(data);
      }
    } catch (err) {
      console.error("Failed to load suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  function addSuggestionAsItem(suggestion: string) {
    setEditItems((prev) => [
      ...prev,
      { name: suggestion, duration_minutes: 10, sort_order: prev.length },
    ]);
    setAiSuggestions((prev) => prev.filter((s) => s !== suggestion));
  }

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
                {editingId === routine.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="max-w-xs"
                  />
                ) : (
                  <CardTitle className="text-lg">{routine.name}</CardTitle>
                )}
                <div className="flex gap-2 items-center">
                  <Badge variant="secondary">{routine.type}</Badge>
                  {routine.is_active && (
                    <Badge variant="default">Active</Badge>
                  )}
                  {editingId === routine.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => saveRoutine(routine.id)}
                        disabled={saving}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditing(routine)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {editingId === routine.id ? (
                <>
                  {editItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...editItems];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setEditItems(updated);
                        }}
                        placeholder="Activity name"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={item.duration_minutes || ""}
                          onChange={(e) => {
                            const updated = [...editItems];
                            updated[index] = {
                              ...updated[index],
                              duration_minutes: parseInt(e.target.value) || 0,
                            };
                            setEditItems(updated);
                          }}
                          className="w-20"
                          min={1}
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      + Add item
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAiSuggestions}
                      disabled={loadingSuggestions}
                    >
                      {loadingSuggestions ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1" />
                      )}
                      AI Suggestions
                    </Button>
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <div className="pt-2 space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        AI Suggestions — click to add:
                      </p>
                      {aiSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => addSuggestionAsItem(s)}
                          className="block w-full text-left p-2 text-sm rounded border border-dashed border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                          <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
