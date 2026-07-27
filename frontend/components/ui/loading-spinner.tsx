export function LoadingSpinner({
  className = 'h-12 w-12',
}: {
  className?: string;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div
        className={`animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 ${className}`}
      />
    </div>
  );
} 