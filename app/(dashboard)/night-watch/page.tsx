"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Pencil, Moon, Plus, X, RotateCcw } from "lucide-react";
import { WatchChat, type ChatMessage } from "@/components/watch/WatchChat";
import { useLocale } from "@/lib/i18n/locale-context";

interface FocusedHour {
  time_block: string;
  activity: string;
  hours: number;
}

interface OpenDim {
  item: string;
  recommendation: string;
}

interface NightWatchSections {
  theme: string;
  bearings: {
    key_work_completed: string;
    work_not_finished: string;
    unexpected_events: string;
  };
  focused_hours: FocusedHour[];
  wins: string[];
  friction_and_drift: {
    attention_wandered: string;
    time_leaked: string;
    patterns: string;
  };
  emotional_weather: string;
  movement: string;
  completed_dims: string[];
  open_dims: OpenDim[];
  wake_effect: {
    carry_forward_tasks: string[];
    energy_state: string;
    open_loops: string[];
  };
  closing_reflection: string;
}

interface Watch {
  id: string;
  date: string;
  type: string;
  status: string;
  sections: NightWatchSections;
}

const emptySections: NightWatchSections = {
  theme: "",
  bearings: {
    key_work_completed: "",
    work_not_finished: "",
    unexpected_events: "",
  },
  focused_hours: [{ time_block: "", activity: "", hours: 0 }],
  wins: [""],
  friction_and_drift: {
    attention_wandered: "",
    time_leaked: "",
    patterns: "",
  },
  emotional_weather: "",
  movement: "",
  completed_dims: [""],
  open_dims: [{ item: "", recommendation: "Do" }],
  wake_effect: {
    carry_forward_tasks: [""],
    energy_state: "",
    open_loops: [""],
  },
  closing_reflection: "",
};

function normalizeSections(raw: Record<string, unknown>): NightWatchSections {
  const asArr = (v: unknown, fallback: string[]): string[] =>
    Array.isArray(v) ? v.map(String) : fallback;
  const asStr = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;
  const asNum = (v: unknown, fallback = 0): number =>
    typeof v === "number" ? v : fallback;
  const asObj = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};

  const br = asObj(raw.bearings);
  const fd = asObj(raw.friction_and_drift);
  const we = asObj(raw.wake_effect);

  const focusedHours: FocusedHour[] = Array.isArray(raw.focused_hours)
    ? raw.focused_hours.map((fh: unknown) => {
        const o = asObj(fh);
        return {
          time_block: asStr(o.time_block),
          activity: asStr(o.activity),
          hours: asNum(o.hours),
        };
      })
    : emptySections.focused_hours;

  const openDims: OpenDim[] = Array.isArray(raw.open_dims)
    ? raw.open_dims.map((d: unknown) => {
        const o = asObj(d);
        return {
          item: asStr(o.item),
          recommendation: asStr(o.recommendation, "Do"),
        };
      })
    : emptySections.open_dims;

  return {
    theme: asStr(raw.theme),
    bearings: {
      key_work_completed: asStr(br.key_work_completed),
      work_not_finished: asStr(br.work_not_finished),
      unexpected_events: asStr(br.unexpected_events),
    },
    focused_hours: focusedHours,
    wins: asArr(raw.wins, emptySections.wins),
    friction_and_drift: {
      attention_wandered: asStr(fd.attention_wandered),
      time_leaked: asStr(fd.time_leaked),
      patterns: asStr(fd.patterns),
    },
    emotional_weather: asStr(raw.emotional_weather),
    movement: asStr(raw.movement),
    completed_dims: asArr(raw.completed_dims, emptySections.completed_dims),
    open_dims: openDims,
    wake_effect: {
      carry_forward_tasks: asArr(we.carry_forward_tasks, emptySections.wake_effect.carry_forward_tasks),
      energy_state: asStr(we.energy_state),
      open_loops: asArr(we.open_loops, emptySections.wake_effect.open_loops),
    },
    closing_reflection: asStr(raw.closing_reflection),
  };
}

export default function NightWatchPage() {
  const [watch, setWatch] = useState<Watch | null>(null);
  const [sections, setSections] = useState<NightWatchSections>(emptySections);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const { t } = useLocale();

  const loadWatch = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/watches/today");
      if (res.ok) {
        const { data } = await res.json();
        if (data.nightWatch) {
          setWatch(data.nightWatch);
          setSections(normalizeSections(data.nightWatch.sections));
        }
      }
    } catch (err) {
      console.error("Failed to load watch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatch();
  }, [loadWatch]);

  async function generateWatch(chatMessages?: ChatMessage[]) {
    setGenerating(true);
    try {
      const res = await fetch("/api/v1/watches/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NIGHT_WATCH",
          chatMessages: chatMessages ?? undefined,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setWatch(data);
        setSections(normalizeSections(data.sections));
        setEditing(true);
      }
    } catch (err) {
      console.error("Failed to generate watch:", err);
    } finally {
      setGenerating(false);
    }
  }

  async function confirmWatch() {
    if (!watch) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/watches/${watch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, status: "confirmed" }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setWatch(data);
        setEditing(false);
      }
    } catch (err) {
      console.error("Failed to confirm watch:", err);
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    if (!watch) return;
    setSaving(true);
    try {
      await fetch(`/api/v1/watches/${watch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
    } catch (err) {
      console.error("Failed to save draft:", err);
    } finally {
      setSaving(false);
    }
  }

  const totalHours = sections.focused_hours.reduce(
    (sum, h) => sum + (h.hours || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No watch yet — show conversational phase
  if (!watch) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Moon className="h-7 w-7 text-indigo-400" />
          <h1 className="text-2xl font-bold">{t("nightWatch.title")}</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <WatchChat
              watchType="NIGHT_WATCH"
              onGenerate={generateWatch}
              generating={generating}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConfirmed = watch.status === "confirmed";
  const isEditing = editing && !isConfirmed;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon className="h-7 w-7 text-indigo-400" />
          <h1 className="text-2xl font-bold">{t("nightWatch.title")}</h1>
          <Badge variant={isConfirmed ? "default" : "secondary"}>
            {isConfirmed ? t("common.confirmed") : t("common.draft")}
          </Badge>
        </div>
        <div className="flex gap-2">
          {!isConfirmed && !editing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWatch(null);
                  setSections(emptySections);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {t("common.redo")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                {t("common.edit")}
              </Button>
              <Button size="sm" onClick={confirmWatch} disabled={saving}>
                <Check className="h-4 w-4 mr-1" />
                {t("common.confirm")}
              </Button>
            </>
          )}
          {isConfirmed && !editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              {t("common.edit")}
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
                {t("common.saveDraft")}
              </Button>
              <Button size="sm" onClick={confirmWatch} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                {t("common.confirm")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Theme */}
      <Card>
        <CardContent className="p-4">
          {isEditing ? (
            <Input
              value={sections.theme}
              onChange={(e) => setSections((prev) => ({ ...prev, theme: e.target.value }))}
              placeholder={t("nightWatch.themePlaceholder")}
              className="text-center italic"
            />
          ) : (
            <p className="text-center italic text-muted-foreground">
              {sections.theme || "—"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bearings from the Day */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("nightWatch.bearings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["key_work_completed", t("nightWatch.keyWorkCompleted")],
              ["work_not_finished", t("nightWatch.workNotFinished")],
              ["unexpected_events", t("nightWatch.unexpectedEvents")],
            ] as [string, string][]
          ).map(([key, label]: [string, string]) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              {isEditing ? (
                <Input
                  value={sections.bearings[key as keyof typeof sections.bearings]}
                  onChange={(e) =>
                    setSections((prev) => ({
                      ...prev,
                      bearings: { ...prev.bearings, [key]: e.target.value },
                    }))
                  }
                />
              ) : (
                <p className="text-sm">{sections.bearings[key as keyof typeof sections.bearings] || "—"}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Focused Hours */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Focused Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isEditing ? (
            <>
              {sections.focused_hours.map((fh, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={fh.time_block}
                    onChange={(e) => {
                      const updated = [...sections.focused_hours];
                      updated[i] = { ...updated[i], time_block: e.target.value };
                      setSections((prev) => ({ ...prev, focused_hours: updated }));
                    }}
                    placeholder="9:00-11:30"
                    className="w-32"
                  />
                  <Input
                    value={fh.activity}
                    onChange={(e) => {
                      const updated = [...sections.focused_hours];
                      updated[i] = { ...updated[i], activity: e.target.value };
                      setSections((prev) => ({ ...prev, focused_hours: updated }));
                    }}
                    placeholder="Activity"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={fh.hours || ""}
                    onChange={(e) => {
                      const updated = [...sections.focused_hours];
                      updated[i] = { ...updated[i], hours: parseFloat(e.target.value) || 0 };
                      setSections((prev) => ({ ...prev, focused_hours: updated }));
                    }}
                    placeholder="Hrs"
                    className="w-20"
                    step={0.5}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setSections((prev) => ({
                        ...prev,
                        focused_hours: prev.focused_hours.filter((_, idx) => idx !== i),
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSections((prev) => ({
                    ...prev,
                    focused_hours: [...prev.focused_hours, { time_block: "", activity: "", hours: 0 }],
                  }))
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Time Block
              </Button>
            </>
          ) : (
            <div className="space-y-1">
              {sections.focused_hours.map((fh, i) => (
                <div key={i} className="flex justify-between text-sm py-1 px-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">{fh.time_block}</span>
                  <span>{fh.activity}</span>
                  <span className="text-muted-foreground">{fh.hours}h</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs font-medium text-muted-foreground pt-1">
            Total: {totalHours} hours
          </p>
        </CardContent>
      </Card>

      {/* Wins */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">What Advanced</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.wins.map((win, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">-</span>
              {isEditing ? (
                <Input
                  value={win}
                  onChange={(e) => {
                    const wins = [...sections.wins];
                    wins[i] = e.target.value;
                    setSections((prev) => ({ ...prev, wins }));
                  }}
                  placeholder="Win or progress"
                />
              ) : (
                <span className="text-sm">{win || "—"}</span>
              )}
            </div>
          ))}
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSections((prev) => ({ ...prev, wins: [...prev.wins, ""] }))}
            >
              + Add Win
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Friction & Drift */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Friction & Drift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["attention_wandered", "Where attention wandered"],
              ["time_leaked", "Where time leaked"],
              ["patterns", "Patterns worth noting"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              {isEditing ? (
                <Input
                  value={sections.friction_and_drift[key]}
                  onChange={(e) =>
                    setSections((prev) => ({
                      ...prev,
                      friction_and_drift: { ...prev.friction_and_drift, [key]: e.target.value },
                    }))
                  }
                />
              ) : (
                <p className="text-sm">{sections.friction_and_drift[key] || "—"}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emotional Weather */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Emotional Weather</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Input
              value={sections.emotional_weather}
              onChange={(e) =>
                setSections((prev) => ({ ...prev, emotional_weather: e.target.value }))
              }
              placeholder="How I'm actually feeling right now"
            />
          ) : (
            <p className="text-sm">{sections.emotional_weather || "—"}</p>
          )}
        </CardContent>
      </Card>

      {/* Movement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Movement</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Input
              value={sections.movement}
              onChange={(e) => setSections((prev) => ({ ...prev, movement: e.target.value }))}
              placeholder="Movement completed today"
            />
          ) : (
            <p className="text-sm">{sections.movement || "—"}</p>
          )}
        </CardContent>
      </Card>

      {/* Completed DIMs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Completed DIMs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.completed_dims.map((dim, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              {isEditing ? (
                <Input
                  value={dim}
                  onChange={(e) => {
                    const dims = [...sections.completed_dims];
                    dims[i] = e.target.value;
                    setSections((prev) => ({ ...prev, completed_dims: dims }));
                  }}
                  placeholder="Completed DIM"
                />
              ) : (
                <span className="text-sm">{dim || "—"}</span>
              )}
            </div>
          ))}
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSections((prev) => ({ ...prev, completed_dims: [...prev.completed_dims, ""] }))
              }
            >
              + Add
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Open DIMs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Open DIMs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.open_dims.map((dim, i) => (
            <div key={i} className="flex gap-2 items-center">
              {isEditing ? (
                <>
                  <Input
                    value={dim.item}
                    onChange={(e) => {
                      const dims = [...sections.open_dims];
                      dims[i] = { ...dims[i], item: e.target.value };
                      setSections((prev) => ({ ...prev, open_dims: dims }));
                    }}
                    placeholder="DIM item"
                    className="flex-1"
                  />
                  <select
                    value={dim.recommendation}
                    onChange={(e) => {
                      const dims = [...sections.open_dims];
                      dims[i] = { ...dims[i], recommendation: e.target.value };
                      setSections((prev) => ({ ...prev, open_dims: dims }));
                    }}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="Do">Do</option>
                    <option value="Defer">Defer</option>
                    <option value="Delegate">Delegate</option>
                    <option value="Delete">Delete</option>
                  </select>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setSections((prev) => ({
                        ...prev,
                        open_dims: prev.open_dims.filter((_, idx) => idx !== i),
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="flex justify-between w-full text-sm py-1 px-2 rounded bg-muted/50">
                  <span>{dim.item || "—"}</span>
                  <Badge variant="outline">{dim.recommendation}</Badge>
                </div>
              )}
            </div>
          ))}
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSections((prev) => ({
                  ...prev,
                  open_dims: [...prev.open_dims, { item: "", recommendation: "Do" }],
                }))
              }
            >
              + Add DIM
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Wake Effect */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Wake Effect → Tomorrow&apos;s First Watch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Carry-forward tasks</label>
            {sections.wake_effect.carry_forward_tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground text-sm">-</span>
                {isEditing ? (
                  <Input
                    value={task}
                    onChange={(e) => {
                      const tasks = [...sections.wake_effect.carry_forward_tasks];
                      tasks[i] = e.target.value;
                      setSections((prev) => ({
                        ...prev,
                        wake_effect: { ...prev.wake_effect, carry_forward_tasks: tasks },
                      }));
                    }}
                    placeholder="Task to carry forward"
                  />
                ) : (
                  <span className="text-sm">{task || "—"}</span>
                )}
              </div>
            ))}
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() =>
                  setSections((prev) => ({
                    ...prev,
                    wake_effect: {
                      ...prev.wake_effect,
                      carry_forward_tasks: [...prev.wake_effect.carry_forward_tasks, ""],
                    },
                  }))
                }
              >
                + Add Task
              </Button>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Energy state</label>
            {isEditing ? (
              <Input
                value={sections.wake_effect.energy_state}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    wake_effect: { ...prev.wake_effect, energy_state: e.target.value },
                  }))
                }
                placeholder="Energy state for tomorrow"
              />
            ) : (
              <p className="text-sm">{sections.wake_effect.energy_state || "—"}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Open loops</label>
            {sections.wake_effect.open_loops.map((loop, i) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground text-sm">-</span>
                {isEditing ? (
                  <Input
                    value={loop}
                    onChange={(e) => {
                      const loops = [...sections.wake_effect.open_loops];
                      loops[i] = e.target.value;
                      setSections((prev) => ({
                        ...prev,
                        wake_effect: { ...prev.wake_effect, open_loops: loops },
                      }));
                    }}
                    placeholder="Open loop"
                  />
                ) : (
                  <span className="text-sm">{loop || "—"}</span>
                )}
              </div>
            ))}
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() =>
                  setSections((prev) => ({
                    ...prev,
                    wake_effect: {
                      ...prev.wake_effect,
                      open_loops: [...prev.wake_effect.open_loops, ""],
                    },
                  }))
                }
              >
                + Add Loop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Closing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Closing the Watch</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={sections.closing_reflection}
              onChange={(e) =>
                setSections((prev) => ({ ...prev, closing_reflection: e.target.value }))
              }
              placeholder="A grounding closing reflection"
              rows={2}
            />
          ) : (
            <p className="text-sm italic">{sections.closing_reflection || "—"}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Anchor dropped. Night Watch complete. Observe the seas, don&apos;t judge the sailor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
