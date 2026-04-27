"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sun, Moon, Anchor } from "lucide-react";
import { useLocale, type Locale } from "@/lib/i18n/locale-context";

export default function OnboardingPage() {
  const { locale, setLocale, t } = useLocale();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [goals, setGoals] = useState(["", "", ""]);
  const [workDescription, setWorkDescription] = useState("");
  const [defaultDayType, setDefaultDayType] = useState("build");
  const [firstWatchTime, setFirstWatchTime] = useState("07:00");
  const [nightWatchTime, setNightWatchTime] = useState("21:00");
  const [movementPreference, setMovementPreference] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const DAY_TYPES = [
    { value: "build", label: t("onboarding.dayBuildLabel"), desc: t("onboarding.dayBuildDesc") },
    { value: "finish", label: t("onboarding.dayFinishLabel"), desc: t("onboarding.dayFinishDesc") },
    { value: "ship", label: t("onboarding.dayShipLabel"), desc: t("onboarding.dayShipDesc") },
    { value: "recover", label: t("onboarding.dayRecoverLabel"), desc: t("onboarding.dayRecoverDesc") },
    { value: "stabilize", label: t("onboarding.dayStabilizeLabel"), desc: t("onboarding.dayStabilizeDesc") },
  ];

  const goalPlaceholders = [
    t("onboarding.goalPlaceholder1"),
    t("onboarding.goalPlaceholder2"),
    t("onboarding.goalPlaceholder3"),
  ];

  const filledGoals = goals.filter((g) => g.trim().length > 0);

  function canProceed() {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return filledGoals.length >= 1;
    return true;
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          timezone,
          locale,
          goals: filledGoals,
          work_description: workDescription.trim() || undefined,
          default_day_type: defaultDayType,
          first_watch_time: firstWatchTime,
          night_watch_time: nightWatchTime,
          movement_preference: movementPreference.trim() || undefined,
          notify_enabled: notifyEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        let msg = data.error || t("onboarding.errorGeneric");
        if (data.details?.fieldErrors) {
          const fields = Object.entries(data.details.fieldErrors)
            .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
            .join("; ");
          if (fields) msg += ` (${fields})`;
        }
        setError(msg);
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError(t("onboarding.errorGeneric"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome Aboard */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <Anchor className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle className="text-2xl">{t("onboarding.welcomeAboard")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {t("onboarding.welcomeBlurb")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Watch system intro */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border text-center space-y-1">
                  <Sun className="h-6 w-6 text-amber-500 mx-auto" />
                  <p className="text-sm font-medium">{t("onboarding.firstWatchTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("onboarding.firstWatchBlurb")}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border text-center space-y-1">
                  <Moon className="h-6 w-6 text-indigo-400 mx-auto" />
                  <p className="text-sm font-medium">{t("onboarding.nightWatchTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("onboarding.nightWatchBlurb")}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center italic">
                {t("onboarding.feedsNote")}
              </p>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">{t("onboarding.languageLabel")}</Label>
                <select
                  id="language"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value="en">{t("settings.english")}</option>
                  <option value="nl">{t("settings.dutch")}</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {t("onboarding.languageHelp")}
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t("onboarding.nameLabel")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("onboarding.namePlaceholder")}
                />
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">{t("onboarding.timezoneLabel")}</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder={t("onboarding.timezonePlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("onboarding.timezoneHelp")}
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="w-full"
              >
                {t("onboarding.next")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Chart Your Course */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("onboarding.chartCourseTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.chartCourseBlurb")}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Goals */}
              <div className="space-y-3">
                <Label>{t("onboarding.goalsLabel")}</Label>
                {goals.map((goal, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={goal}
                      onChange={(e) => {
                        const updated = [...goals];
                        updated[i] = e.target.value;
                        setGoals(updated);
                      }}
                      placeholder={
                        goalPlaceholders[i] ?? t("onboarding.goalPlaceholderOther")
                      }
                    />
                    {goals.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                        className="shrink-0 text-muted-foreground"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGoals([...goals, ""])}
                >
                  {t("onboarding.addGoal")}
                </Button>
              </div>

              {/* Work description */}
              <div className="space-y-2">
                <Label htmlFor="work">
                  {t("onboarding.workLabel")}
                </Label>
                <Textarea
                  id="work"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder={t("onboarding.workPlaceholder")}
                  rows={2}
                />
              </div>

              {/* Day type */}
              <div className="space-y-2">
                <Label>{t("onboarding.rhythmLabel")}</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_TYPES.map((dt) => (
                    <Button
                      key={dt.value}
                      size="sm"
                      variant={
                        defaultDayType === dt.value ? "default" : "outline"
                      }
                      onClick={() => setDefaultDayType(dt.value)}
                      title={dt.desc}
                    >
                      {dt.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {DAY_TYPES.find((d) => d.value === defaultDayType)?.desc}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  {t("onboarding.back")}
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  {t("onboarding.next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Set Your Watch Times */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("onboarding.watchTimesTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.watchTimesBlurb")}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Watch times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    {t("onboarding.firstWatchTitle")}
                  </Label>
                  <input
                    type="time"
                    value={firstWatchTime}
                    onChange={(e) => setFirstWatchTime(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    {t("onboarding.nightWatchTitle")}
                  </Label>
                  <input
                    type="time"
                    value={nightWatchTime}
                    onChange={(e) => setNightWatchTime(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("onboarding.watchTimesHelp")}
              </p>

              {/* Movement */}
              <div className="space-y-2">
                <Label htmlFor="movement">{t("onboarding.movementLabel")}</Label>
                <Textarea
                  id="movement"
                  value={movementPreference}
                  onChange={(e) => setMovementPreference(e.target.value)}
                  placeholder={t("onboarding.movementPlaceholder")}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {t("onboarding.movementHelp")}
                </p>
              </div>

              {/* Notifications */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEnabled}
                  onChange={(e) => setNotifyEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">
                  {t("onboarding.notifyLabel")}
                </span>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  {t("onboarding.back")}
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  {t("onboarding.next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Your First Bearing */}
        {step === 4 && (
          <Card>
            <CardHeader className="text-center">
              <Anchor className="h-8 w-8 text-primary mx-auto mb-1" />
              <CardTitle>{t("onboarding.firstBearingTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.firstBearingBlurb")}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Summary */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t("onboarding.summaryName")}</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t("onboarding.summaryTimezone")}</span>
                  <span className="font-medium">{timezone}</span>
                </div>

                <div className="py-2 border-b">
                  <span className="text-muted-foreground">{t("onboarding.summaryGoals")}</span>
                  <ul className="mt-1 space-y-1">
                    {filledGoals.map((g, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-primary">&#10003;</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>

                {workDescription && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t("onboarding.summaryWork")}</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {workDescription}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t("onboarding.summaryDayRhythm")}</span>
                  <span className="font-medium">
                    {DAY_TYPES.find((d) => d.value === defaultDayType)?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>{firstWatchTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    <span>{nightWatchTime}</span>
                  </div>
                </div>

                {movementPreference && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t("onboarding.summaryMovement")}</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {movementPreference}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground italic">
                {t("onboarding.anchorSet")}
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  {t("onboarding.back")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? t("onboarding.settingSail") : t("onboarding.beginVoyage")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
