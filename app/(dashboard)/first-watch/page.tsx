"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Pencil, Sun, RotateCcw } from "lucide-react";
import { WatchChat, type ChatMessage } from "@/components/watch/WatchChat";

interface FirstWatchSections {
  gratitude: string[];
  wake_inheritance: {
    energy_state: string;
    constraints: string;
    open_loops: string;
    emotional_residue: string;
  };
  mission_focus: {
    day_type: string;
    primary_focus: string;
  };
  top_priorities: string[];
  drift_watch: {
    risks: string[];
    course_correction: string;
  };
  movement: string;
  open_dims: string[];
  operating_posture: string;
  closing_bearing: string;
}

interface Watch {
  id: string;
  date: string;
  type: string;
  status: string;
  sections: FirstWatchSections;
}

const emptySections: FirstWatchSections = {
  gratitude: ["", "", ""],
  wake_inheritance: {
    energy_state: "",
    constraints: "",
    open_loops: "",
    emotional_residue: "",
  },
  mission_focus: { day_type: "build", primary_focus: "" },
  top_priorities: ["", "", ""],
  drift_watch: { risks: ["", ""], course_correction: "" },
  movement: "",
  open_dims: [""],
  operating_posture: "",
  closing_bearing: "",
};

function normalizeSections(raw: Record<string, unknown>): FirstWatchSections {
  const asArr = (v: unknown, fallback: string[]): string[] =>
    Array.isArray(v) ? v.map(String) : fallback;
  const asStr = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;
  const asObj = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};

  const wi = asObj(raw.wake_inheritance);
  const mf = asObj(raw.mission_focus);
  const dw = asObj(raw.drift_watch);

  return {
    gratitude: asArr(raw.gratitude, emptySections.gratitude),
    wake_inheritance: {
      energy_state: asStr(wi.energy_state),
      constraints: asStr(wi.constraints),
      open_loops: asStr(wi.open_loops),
      emotional_residue: asStr(wi.emotional_residue),
    },
    mission_focus: {
      day_type: asStr(mf.day_type, "build"),
      primary_focus: asStr(mf.primary_focus),
    },
    top_priorities: asArr(raw.top_priorities, emptySections.top_priorities),
    drift_watch: {
      risks: asArr(dw.risks, emptySections.drift_watch.risks),
      course_correction: asStr(dw.course_correction),
    },
    movement: asStr(raw.movement),
    open_dims: asArr(raw.open_dims, emptySections.open_dims),
    operating_posture: asStr(raw.operating_posture),
    closing_bearing: asStr(raw.closing_bearing),
  };
}

export default function FirstWatchPage() {
  const [watch, setWatch] = useState<Watch | null>(null);
  const [sections, setSections] = useState<FirstWatchSections>(emptySections);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const loadWatch = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/watches/today");
      if (res.ok) {
        const { data } = await res.json();
        if (data.firstWatch) {
          setWatch(data.firstWatch);
          setSections(normalizeSections(data.firstWatch.sections));
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
          type: "FIRST_WATCH",
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

  function updateSection<K extends keyof FirstWatchSections>(
    key: K,
    value: FirstWatchSections[K]
  ) {
    setSections((prev) => ({ ...prev, [key]: value }));
  }

  function updateArrayItem(
    key: "gratitude" | "top_priorities" | "open_dims",
    index: number,
    value: string
  ) {
    setSections((prev) => {
      const arr = [...(prev[key] as string[])];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  }

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
          <Sun className="h-7 w-7 text-amber-500" />
          <h1 className="text-2xl font-bold">First Watch</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <WatchChat
              watchType="FIRST_WATCH"
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
          <Sun className="h-7 w-7 text-amber-500" />
          <h1 className="text-2xl font-bold">First Watch</h1>
          <Badge variant={isConfirmed ? "default" : "secondary"}>
            {isConfirmed ? "Confirmed" : "Draft"}
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
                Redo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button size="sm" onClick={confirmWatch} disabled={saving}>
                <Check className="h-4 w-4 mr-1" />
                Confirm
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
              Edit
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
                Save Draft
              </Button>
              <Button size="sm" onClick={confirmWatch} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Confirm
              </Button>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic">
        This log observes the seas; it does not judge the sailor.
      </p>

      {/* Gratitude */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gratitude</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.gratitude.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
              {isEditing ? (
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem("gratitude", i, e.target.value)}
                  placeholder={`Gratitude item ${i + 1}`}
                />
              ) : (
                <span className="text-sm">{item || "—"}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Wake Inheritance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Wake Inheritance</CardTitle>
          <p className="text-xs text-muted-foreground">from prior Night Watch</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["energy_state", "Energy State"],
              ["constraints", "Constraints"],
              ["open_loops", "Open Loops"],
              ["emotional_residue", "Emotional Residue"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              {isEditing ? (
                <Input
                  value={sections.wake_inheritance[key]}
                  onChange={(e) =>
                    updateSection("wake_inheritance", {
                      ...sections.wake_inheritance,
                      [key]: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-sm">{sections.wake_inheritance[key] || "—"}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Mission Focus */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mission Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Day Type</label>
            {isEditing ? (
              <div className="flex gap-2 pt-1">
                {["build", "finish", "ship", "recover", "stabilize"].map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={sections.mission_focus.day_type === t ? "default" : "outline"}
                    onClick={() =>
                      updateSection("mission_focus", {
                        ...sections.mission_focus,
                        day_type: t,
                      })
                    }
                  >
                    {t}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm">
                <Badge variant="secondary">{sections.mission_focus.day_type}</Badge>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Primary Focus</label>
            {isEditing ? (
              <Input
                value={sections.mission_focus.primary_focus}
                onChange={(e) =>
                  updateSection("mission_focus", {
                    ...sections.mission_focus,
                    primary_focus: e.target.value,
                  })
                }
                placeholder="The one thing that matters most today"
              />
            ) : (
              <p className="text-sm">{sections.mission_focus.primary_focus || "—"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Priorities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Priorities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.top_priorities.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
              {isEditing ? (
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem("top_priorities", i, e.target.value)}
                  placeholder={`Priority ${i + 1}`}
                />
              ) : (
                <span className="text-sm">{item || "—"}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Drift Watch */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Drift Watch & Course Correction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Drift Risks</label>
            {sections.drift_watch.risks.map((risk, i) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground text-sm">-</span>
                {isEditing ? (
                  <Input
                    value={risk}
                    onChange={(e) => {
                      const risks = [...sections.drift_watch.risks];
                      risks[i] = e.target.value;
                      updateSection("drift_watch", { ...sections.drift_watch, risks });
                    }}
                    placeholder={`Drift risk ${i + 1}`}
                  />
                ) : (
                  <span className="text-sm">{risk || "—"}</span>
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Course Correction</label>
            {isEditing ? (
              <Input
                value={sections.drift_watch.course_correction}
                onChange={(e) =>
                  updateSection("drift_watch", {
                    ...sections.drift_watch,
                    course_correction: e.target.value,
                  })
                }
                placeholder="One gentle, practical correction"
              />
            ) : (
              <p className="text-sm">{sections.drift_watch.course_correction || "—"}</p>
            )}
          </div>
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
              onChange={(e) => updateSection("movement", e.target.value)}
              placeholder="Planned movement today"
            />
          ) : (
            <p className="text-sm">{sections.movement || "—"}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Purpose: regulation + energy, not perfection.
          </p>
        </CardContent>
      </Card>

      {/* Open DIMs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Open DIMs / Carry-Forward</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.open_dims.map((dim, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">-</span>
              {isEditing ? (
                <div className="flex-1 flex gap-2">
                  <Input
                    value={dim}
                    onChange={(e) => updateArrayItem("open_dims", i, e.target.value)}
                    placeholder="DIM item"
                    className="flex-1"
                  />
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
                    ×
                  </Button>
                </div>
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
                setSections((prev) => ({ ...prev, open_dims: [...prev.open_dims, ""] }))
              }
            >
              + Add DIM
            </Button>
          )}
          <p className="text-xs text-muted-foreground">Captured, not urgent.</p>
        </CardContent>
      </Card>

      {/* Operating Posture */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Operating Posture</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Input
              value={sections.operating_posture}
              onChange={(e) => updateSection("operating_posture", e.target.value)}
              placeholder="How to move through the day"
            />
          ) : (
            <p className="text-sm">{sections.operating_posture || "—"}</p>
          )}
        </CardContent>
      </Card>

      {/* Closing Bearing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Closing Bearing</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={sections.closing_bearing}
              onChange={(e) => updateSection("closing_bearing", e.target.value)}
              placeholder="Orientation, reassurance, forward momentum"
              rows={2}
            />
          ) : (
            <p className="text-sm italic">{sections.closing_bearing || "—"}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Proceed steadily. Observe the seas, don&apos;t judge the sailor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
