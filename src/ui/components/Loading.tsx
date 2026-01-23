// Simple utility function for className merging
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

export function LoadingSpinner({ size = "md", className, message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full border-2 border-accent-500 border-t-transparent animate-spin",
          sizeClasses[size]
        )}
      />
      {message && (
        <span className="text-sm text-muted font-medium">{message}</span>
      )}
    </div>
  );
}

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export function LoadingCard({ message = "Loading...", className }: LoadingCardProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 rounded-lg border border-ink-900/10 bg-surface",
      className
    )}>
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-ink-900/10 rounded",
        animate && "animate-pulse",
        className
      )}
    />
  );
}