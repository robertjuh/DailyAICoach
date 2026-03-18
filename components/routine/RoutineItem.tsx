"use client";

import { Input } from "@/components/ui/input";

interface RoutineItemProps {
  index: number;
  name: string;
  duration: number;
  placeholder?: string;
  onNameChange: (value: string) => void;
  onDurationChange: (value: number) => void;
}

export function RoutineItem({
  index,
  name,
  duration,
  placeholder,
  onNameChange,
  onDurationChange,
}: RoutineItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={placeholder ?? "Activity name"}
        className="flex-1"
      />
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={duration || ""}
          onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
          placeholder="Min"
          className="w-20"
          min={1}
          max={180}
        />
        <span className="text-sm text-muted-foreground">min</span>
      </div>
    </div>
  );
}
