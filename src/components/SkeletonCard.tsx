interface SkeletonCardProps {
  height?: string;
}

export default function SkeletonCard({ height = 'h-48' }: SkeletonCardProps) {
  return (
    <div
      className={`w-full ${height} rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse`}
      aria-hidden="true"
    />
  );
}
