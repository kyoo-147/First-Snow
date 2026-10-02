export function ProgressStrip({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-snow-primary-soft">
      <div className="h-full rounded-full bg-snow-primary" style={{ width: `${value}%` }} />
    </div>
  );
}
