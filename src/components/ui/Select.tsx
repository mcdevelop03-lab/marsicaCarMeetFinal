import { SelectHTMLAttributes } from "react";

export default function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-3 py-2.5 bg-surface-dim border border-white/10 hover:border-white/20 focus:border-accent-red/50 user-invalid:border-accent-red text-xs font-mono text-white focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
