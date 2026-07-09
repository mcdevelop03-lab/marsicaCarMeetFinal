import { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2.5 bg-surface-dim border border-white/10 hover:border-white/20 focus:border-accent-red/50 text-xs font-mono text-white placeholder-white/20 focus:outline-none ${className}`}
      {...props}
    />
  );
}
