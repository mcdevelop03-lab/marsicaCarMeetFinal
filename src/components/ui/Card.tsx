export default function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-surface-card border border-white/5 ${className}`}>{children}</div>
  );
}
