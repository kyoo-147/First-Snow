import type { MoodOption, SnowExpression } from "@/types/snow";
import { cn } from "@/lib/utils";

export function MoodCard({
  mood,
  selected,
}: {
  mood: MoodOption;
  selected: boolean;
}) {
  const icons: Record<SnowExpression, string> = {
    calm: "Cloud",
    happy: "Star",
    excited: "Spark",
    thinking: "Moon",
    encouraging: "Heart",
    sleepy: "Rest",
    "sad-supportive": "Care",
  };

  return (
    <button
      aria-label={`${mood.label}: ${mood.description}`}
      className={cn(
        "min-h-24 rounded-[var(--radius-md)] border p-3 text-center transition active:scale-[0.98]",
        selected
          ? "border-snow-primary bg-snow-primary-soft text-snow-primary-dark shadow-[var(--shadow-card)]"
          : "border-snow-border bg-snow-surface text-snow-muted hover:bg-snow-surface-soft",
      )}
    >
      <span className="block text-xl font-black">{icons[mood.value]}</span>
      <span className="mt-2 block text-sm font-extrabold">{mood.label}</span>
    </button>
  );
}
