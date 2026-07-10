import { TextareaHTMLAttributes } from "react";

export default function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2.5 bg-surface-dim border border-white/10 hover:border-white/20 focus:border-accent-red/50 user-invalid:border-accent-red text-xs font-mono text-white placeholder-white/20 focus:outline-none resize-y ${className}`}
      {...props}
    />
  );
}
