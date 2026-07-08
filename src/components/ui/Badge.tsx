export default function Badge({
  tone = "muted",
  className = "",
  children,
}: {
  tone?: "accent" | "muted";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    accent: "bg-accent-red/10 border-accent-red/20 text-accent-red",
    muted: "bg-white/5 border-white/10 text-white/60",
  };
  return (
    <span
      className={`px-2 py-0.5 border text-[9px] font-mono font-bold tracking-widest uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
