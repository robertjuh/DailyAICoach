"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ChevronDown, ChevronUp, Compass } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface HourlyCheckin {
  id: string;
  time: string;
  working_on: string;
  drift_note?: string | null;
  win?: string | null;
  energy?: number | null;
  next_plan?: string | null;
}

interface GpsStatus {
  enabled: boolean;
  isReady: boolean;
  minutesUntilReady: number;
  inActiveWindow: boolean;
}

interface GpsSettings {
  hourly_gps_enabled: boolean;
  hourly_gps_interval: number;
  hourly_gps_start_time: string | null;
  hourly_gps_end_time: string | null;
}

const energyEmojis = ["", "1", "2", "3", "4", "5"];

export default function HourlyGpsPage() {
  const [checkins, setCheckins] = useState<HourlyCheckin[]>([]);
  const [status, setStatus] = useState<GpsStatus | null>(null);
  const [settings, setSettings] = useState<GpsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const { t } = useLocale();

  // Form state
  const [workingOn, setWorkingOn] = useState("");
  const [driftNote, setDriftNote] = useState("");
  const [win, setWin] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [nextPlan, setNextPlan] = useState("");
  const [dimCapture, setDimCapture] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [checkinsRes, statusRes, settingsRes] = await Promise.all([
        fetch("/api/v1/hourly-gps/today"),
        fetch("/api/v1/hourly-gps/status"),
        fetch("/api/v1/hourly-gps/settings"),
      ]);

      if (checkinsRes.ok) {
        const { data } = await checkinsRes.json();
        setCheckins(data);
      }
      if (statusRes.ok) {
        const { data } = await statusRes.json();
        setStatus(data);
      }
      if (settingsRes.ok) {
        const { data } = await settingsRes.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch GPS data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workingOn.trim()) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        working_on: workingOn.trim(),
      };
      if (driftNote.trim()) body.drift_note = driftNote.trim();
      if (win.trim()) body.win = win.trim();
      if (energy) body.energy = energy;
      if (nextPlan.trim()) body.next_plan = nextPlan.trim();
      if (dimCapture.trim()) body.dim_capture = dimCapture.trim();

      const res = await fetch("/api/v1/hourly-gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Reset form
        setWorkingOn("");
        setDriftNote("");
        setWin("");
        setEnergy(null);
        setNextPlan("");
        setDimCapture("");
        setShowOptional(false);
        // Refresh data
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to submit check-in:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSettingsUpdate(updates: Partial<GpsSettings>) {
    try {
      const res = await fetch("/api/v1/hourly-gps/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const { data } = await res.json();
        setSettings(data);
        // Refresh status after settings change
        const statusRes = await fetch("/api/v1/hourly-gps/status");
        if (statusRes.ok) {
          const { data: statusData } = await statusRes.json();
          setStatus(statusData);
        }
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">{t("hourlyGps.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          {status?.enabled && status.inActiveWindow && (
            <span className="text-xs text-muted-foreground">
              {status.isReady ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {t("hourlyGps.checkinReady")}
                </span>
              ) : (
                t("hourlyGps.nextIn", { minutes: String(status.minutesUntilReady) })
              )}
            </span>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && settings && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("hourlyGps.enableLabel")}</span>
              <button
                onClick={() => handleSettingsUpdate({ hourly_gps_enabled: !settings.hourly_gps_enabled })}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  settings.hourly_gps_enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.hourly_gps_enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("hourlyGps.intervalLabel")}</span>
              <select
                value={settings.hourly_gps_interval}
                onChange={(e) => handleSettingsUpdate({ hourly_gps_interval: Number(e.target.value) })}
                className="text-sm rounded-md border border-border bg-background px-2 py-1"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("hourlyGps.activeHoursLabel")}</span>
              <div className="flex items-center gap-1 text-sm">
                <input
                  type="time"
                  value={settings.hourly_gps_start_time ?? "09:00"}
                  onChange={(e) => handleSettingsUpdate({ hourly_gps_start_time: e.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1"
                />
                <span className="text-muted-foreground">{t("common.to")}</span>
                <input
                  type="time"
                  value={settings.hourly_gps_end_time ?? "18:00"}
                  onChange={(e) => handleSettingsUpdate({ hourly_gps_end_time: e.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick input */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder={t("hourlyGps.workingOnPlaceholder")}
                value={workingOn}
                onChange={(e) => setWorkingOn(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>

            {/* Energy quick select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("hourlyGps.energyLabel")}</span>
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergy(energy === level ? null : level)}
                  className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                    energy === level
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {energyEmojis[level]}
                </button>
              ))}
            </div>

            {/* Toggle optional fields */}
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showOptional ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showOptional ? t("common.lessOptions") : t("common.moreOptions")}
            </button>

            {showOptional && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t("hourlyGps.driftPlaceholder")}
                  value={driftNote}
                  onChange={(e) => setDriftNote(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="Quick win?"
                  value={win}
                  onChange={(e) => setWin(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="What's next?"
                  value={nextPlan}
                  onChange={(e) => setNextPlan(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="Capture a DIM (idea, decision, task)"
                  value={dimCapture}
                  onChange={(e) => setDimCapture(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={!workingOn.trim() || submitting}
              className="w-full"
            >
              {submitting ? t("hourlyGps.logging") : t("hourlyGps.logPosition")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Today's timeline */}
      {checkins.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Timeline ({checkins.length} check-in{checkins.length !== 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {[...checkins].reverse().map((c, i) => (
                <div
                  key={c.id}
                  className={`flex gap-3 py-2.5 ${
                    i > 0 ? "border-t border-border/50" : ""
                  }`}
                >
                  {/* Time */}
                  <span className="text-xs text-muted-foreground font-mono w-12 pt-0.5 shrink-0">
                    {formatTime(c.time)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{c.working_on}</p>
                    {c.drift_note && (
                      <p className="text-xs text-orange-500 mt-0.5">
                        Drift: {c.drift_note}
                      </p>
                    )}
                    {c.win && (
                      <p className="text-xs text-green-500 mt-0.5">
                        Win: {c.win}
                      </p>
                    )}
                    {c.next_plan && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Next: {c.next_plan}
                      </p>
                    )}
                  </div>

                  {/* Energy indicator */}
                  {c.energy && (
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 h-fit ${
                        c.energy >= 4
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : c.energy >= 3
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {c.energy}/5
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {checkins.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          {t("hourlyGps.noCheckins")}
        </p>
      )}
    </div>
  );
}
