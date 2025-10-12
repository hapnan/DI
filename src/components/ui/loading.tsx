import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
  fullPage?: boolean;
}

export function Loading({
  className,
  size = "md",
  text = "Loading...",
  fullPage = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-3",
    fullPage && "min-h-screen",
    !fullPage && "py-8",
    className,
  );

  return (
    <div className={containerClasses}>
      <Spinner className={cn(sizeClasses[size], "text-primary")} />
      {text && (
        <p className={cn("text-muted-foreground", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

// Specific loading components for different contexts
export function PageLoading({ text }: { text?: string }) {
  return (
    <Loading
      fullPage
      size="lg"
      text={text || "Loading page..."}
      className="bg-background"
    />
  );
}

export function SectionLoading({ text }: { text?: string }) {
  return <Loading size="md" text={text || "Loading..."} className="py-12" />;
}

export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Spinner className="size-4" />
      {text && <span className="text-muted-foreground text-sm">{text}</span>}
    </div>
  );
}

// Button loading component for loading states in buttons
export function ButtonLoading({
  text,
  size = "sm",
}: {
  text?: string;
  size?: "sm" | "md";
}) {
  const spinnerSizes = {
    sm: "size-4",
    md: "size-5",
  };

  return (
    <div className="flex items-center gap-2">
      <Spinner className={cn(spinnerSizes[size], "text-current")} />
      {text && <span>{text}</span>}
    </div>
  );
}
