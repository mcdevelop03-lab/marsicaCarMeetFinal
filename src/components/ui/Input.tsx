import { InputHTMLAttributes } from "react";

// `user-invalid` (non `invalid`) segnala il campo solo dopo che l'utente lo ha
// toccato e lasciato invalido: all'apertura della pagina nessun campo è rosso.
export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2.5 bg-surface-dim border border-white/10 hover:border-white/20 focus:border-accent-red/50 user-invalid:border-accent-red text-xs font-mono text-white placeholder-white/20 focus:outline-none ${className}`}
      {...props}
    />
  );
}
