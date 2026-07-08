export default function SectionHeading({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={`font-display text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3 ${className}`}
    >
      <span className="w-1.5 h-6 bg-accent-red" />
      {children}
    </h2>
  );
}
