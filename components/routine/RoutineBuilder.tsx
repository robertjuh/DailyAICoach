"use client";

import { RoutineItem } from "./RoutineItem";

interface RoutineItemData {
  name: string;
  duration_minutes: number;
}

interface RoutineBuilderProps {
  items: RoutineItemData[];
  onChange: (items: RoutineItemData[]) => void;
  placeholders?: string[];
}

export function RoutineBuilder({
  items,
  onChange,
  placeholders = ["Meditate", "Exercise", "Read"],
}: RoutineBuilderProps) {
  function updateItem(index: number, field: "name" | "duration_minutes", value: string | number) {
    const updated = [...items];
    if (field === "name") {
      updated[index] = { ...updated[index], name: value as string };
    } else {
      updated[index] = { ...updated[index], duration_minutes: value as number };
    }
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <RoutineItem
          key={i}
          index={i}
          name={item.name}
          duration={item.duration_minutes}
          placeholder={placeholders[i]}
          onNameChange={(v) => updateItem(i, "name", v)}
          onDurationChange={(v) => updateItem(i, "duration_minutes", v)}
        />
      ))}
    </div>
  );
}
