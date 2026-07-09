import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-accent-red hover:text-white",
  outline: "border border-white/20 text-white hover:border-white hover:bg-white/5",
  ghost: "text-white/60 hover:text-white",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-6 py-3 font-mono font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
