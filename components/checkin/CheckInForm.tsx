"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CheckInFormProps {
  onSubmit: (data: {
    energy: number;
    focus: number;
    mood: number;
    note?: string;
  }) => void;
  isLoading?: boolean;
}

const labels: Record<number, string> = {
  1: "Low",
  2: "Below average",
  3: "Average",
  4: "Good",
  5: "High",
};

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">
          {value} — {labels[value]}
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
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

export function CheckInForm({ onSubmit, isLoading }: CheckInFormProps) {
  const [energy, setEnergy] = useState(3);
  const [focus, setFocus] = useState(3);
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");

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
        <CardTitle>Daily Check-in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <SliderField label="Energy" value={energy} onChange={setEnergy} />
          <SliderField label="Focus" value={focus} onChange={setFocus} />
          <SliderField label="Mood" value={mood} onChange={setMood} />

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How are you feeling today?"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Check-in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
