"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";

interface CheckInFormProps {
  onSubmit: (data: {
    energy: number;
    focus: number;
    mood: number;
    note?: string;
  }) => void;
  isLoading?: boolean;
}

function SliderField({
  label,
  value,
  onChange,
  valueLabel,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  valueLabel: string;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {value} — {valueLabel}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        min={1}
        max={5}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export function CheckInForm({ onSubmit, isLoading }: CheckInFormProps) {
  const [energy, setEnergy] = useState(3);
  const [focus, setFocus] = useState(3);
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const { t } = useLocale();

  const labels: Record<number, string> = {
    1: t("common.low"),
    2: t("common.belowAverage"),
    3: t("common.average"),
    4: t("common.good"),
    5: t("common.high"),
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      energy,
      focus,
      mood,
      note: note.trim() || undefined,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("checkin.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <SliderField label={t("checkin.energy")} value={energy} onChange={setEnergy} valueLabel={labels[energy]} lowLabel={t("common.low")} highLabel={t("common.high")} />
          <SliderField label={t("checkin.focus")} value={focus} onChange={setFocus} valueLabel={labels[focus]} lowLabel={t("common.low")} highLabel={t("common.high")} />
          <SliderField label={t("checkin.mood")} value={mood} onChange={setMood} valueLabel={labels[mood]} lowLabel={t("common.low")} highLabel={t("common.high")} />

          <div className="space-y-2">
            <Label>{t("checkin.notesLabel")}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("checkin.notesPlaceholder")}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("checkin.submitting") : t("checkin.submitButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
