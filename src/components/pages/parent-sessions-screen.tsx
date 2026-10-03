import { ParentTranscriptsScreen } from "@/components/pages/parent-transcripts-screen";

/**
 * The legacy sessions screen presented fixture-derived durations, moods, and review
 * states. Until those fields have an authoritative persisted model, this route uses
 * the real parent transcript surface instead of inventing session analytics.
 */
export function ParentSessionsScreen({ childId }: { childId: string }) {
  return <ParentTranscriptsScreen childId={childId} />;
}
