"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lightbulb,
  GitBranch,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Settings2,
} from "lucide-react";

type Dim = {
  id: string;
  content: string;
  category: "DECISION" | "IDEA" | "MICRO_TASK";
  status: "OPEN" | "COMPLETED" | "DEFERRED" | "DELEGATED" | "DELETED";
  priority_score: number | null;
  recommendation: "DO" | "DEFER" | "DELEGATE" | "DELETE" | null;
  ai_reasoning: string | null;
  source: string;
  related_goal: { id: string; title: string } | null;
  created_at: string;
};

type PriorityFilter = {
  id: string;
  name: string;
  weight: number;
  is_active: boolean;
};

const CATEGORY_ICONS = {
  DECISION: GitBranch,
  IDEA: Lightbulb,
  MICRO_TASK: Zap,
};

const CATEGORY_COLORS = {
  DECISION: "bg-purple-100 text-purple-700",
  IDEA: "bg-amber-100 text-amber-700",
  MICRO_TASK: "bg-blue-100 text-blue-700",
};

const REC_COLORS = {
  DO: "bg-green-100 text-green-700",
  DEFER: "bg-yellow-100 text-yellow-700",
  DELEGATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

const STATUS_ACTIONS = ["COMPLETED", "DEFERRED", "DELEGATED", "DELETED"] as const;

export default function DimsPage() {
  const [dims, setDims] = useState<Dim[]>([]);
  const [filters, setFilters] = useState<PriorityFilter[]>([]);
  const [newDim, setNewDim] = useState("");
  const [newCategory, setNewCategory] = useState<"DECISION" | "IDEA" | "MICRO_TASK">("IDEA");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"open" | "closed" | "all">("open");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchDims = useCallback(async () => {
    const params = new URLSearchParams();
    const res = await fetch(`/api/v1/dims?${params}`);
    if (res.ok) {
      const json = await res.json();
      setDims(
        json.data
      );

    }
  }, [tab]);

  const fetchFilters = useCallback(async () => {
    const res = await fetch("/api/v1/dims/filters");
    if (res.ok) {
      const json = await res.json();
      setFilters(json.data);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDims(), fetchFilters()]).finally(() => setLoading(false));
  }, [fetchDims, fetchFilters]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newDim.trim()) return;
    setCreating(true);

    const res = await fetch("/api/v1/dims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newDim.trim(), category: newCategory }),
    });

    if (res.ok) {
      setNewDim("");
      // Small delay to let Priority Engine start, then refresh
      setTimeout(() => fetchDims(), 500);
    }
    setCreating(false);
  }


  async function handleReanalyze(dimId: string) {
    await fetch("/api/v1/dims/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dim_id: dimId }),
    });
    fetchDims();
  }

  async function handleFilterUpdate(id: string, weight: number) {
    await fetch("/api/v1/dims/filters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ id, weight }]),
    });
    fetchFilters();
  }



  const openCount = dims.filter((d) => d.status === "OPEN").length;
  const closedCount = dims.filter((d) => d.status !== "OPEN").length;
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DIM Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Decisions, Ideas &amp; Micro-tasks — observe the squirrel, don&apos;t
            chase it
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Settings2 className="h-4 w-4 mr-1" />
          Filters
        </Button>
      </div>

      {/* Priority Filters panel */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Priority Engine Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filters.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No filters yet. Complete onboarding to get defaults.
              </p>
            )}
            {filters.map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <span className="text-sm w-32 truncate">{f.name}</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={f.weight}
                  onChange={(e) =>
                    handleFilterUpdate(f.id, parseInt(e.target.value))
                  }
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-medium w-8 text-right">
                  {f.weight}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick capture bar */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleCreate} className="flex gap-2">
            <div className="flex gap-1">
              {(["IDEA", "DECISION", "MICRO_TASK"] as const).map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`p-2 rounded-md transition-colors ${
                      newCategory === cat
                        ? CATEGORY_COLORS[cat]
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title={cat.replace("_", " ")}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <Input
              value={newDim}
              onChange={(e) => setNewDim(e.target.value)}
              placeholder="Capture a thought... (Enter to save)"
              className="flex-1"
              disabled={creating}
            />
            <Button type="submit" disabled={creating || !newDim.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "DIM it"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["open", "closed", "all"] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t)}
          >
            {t === "open" ? `Open (${openCount})` : t === "closed" ? "Closed " + `(${closedCount})` : "All"}
          </Button>
        ))}
      </div>

      {/* DIM list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : dims.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {tab === "open"
              ? "No open DIMs. Capture a thought above!"
              : "No DIMs found."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          { dims.filter((d) => {
              if (tab === "open") return d.status === "OPEN";
              if (tab === "closed") return d.status !== "OPEN";
              if (tab === "all") return true;
              return true;
            }).map((dim) => {
            const CatIcon = CATEGORY_ICONS[dim.category];
            const isExpanded = expandedId === dim.id;

            return (
              
              <Card key={dim.id} className="overflow-hidden">
                <h1 key={dim.id}>{dim.status}</h1>
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : dim.id)}
                >
                  <CatIcon
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      CATEGORY_COLORS[dim.category].split(" ")[1]
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        dim.status !== "OPEN"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {dim.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          CATEGORY_COLORS[dim.category]
                        }`}
                      >
                        {dim.category.replace("_", " ")}
                      </span>
                      {dim.priority_score !== null && (
                        <span className="text-xs text-muted-foreground">
                          Score: {dim.priority_score}
                        </span>
                      )}
                      {dim.recommendation && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            REC_COLORS[dim.recommendation]
                          }`}
                        >
                          {dim.recommendation}
                        </span>
                      )}
                      {dim.related_goal && (
                        <span className="text-xs text-muted-foreground">
                          Goal: {dim.related_goal.title}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t pt-3">
                    {dim.ai_reasoning && (
                      <p className="text-sm text-muted-foreground italic">
                        {dim.ai_reasoning}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Source: {dim.source}</span>
                      <span>·</span>
                      <span>
                        {new Date(dim.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {dim.status === "OPEN" && (
                      <div className="flex flex-wrap gap-2">
                        {STATUS_ACTIONS.map((action) => (
                          <Button
                            key={action}
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriage(dim.id, action);
                            }}
                          >
                            {action === "COMPLETED"
                              ? "Done"
                              : action.charAt(0) + action.slice(1).toLowerCase()}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReanalyze(dim.id);
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Re-analyze
                        </Button>
                      </div>
                    )}

                    {dim.status !== "OPEN" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriage(dim.id, "OPEN");
                        }}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
