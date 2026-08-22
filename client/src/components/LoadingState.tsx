interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <div className="loading-spinner" aria-hidden />
      <p className="font-mono text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
