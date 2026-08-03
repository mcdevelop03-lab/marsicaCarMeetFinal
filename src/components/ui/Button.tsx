import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-accent-red hover:text-white",
  outline: "border border-white/20 text-white hover:border-white hover:bg-white/5",
  ghost: "text-white/60 hover:text-white",
};

/**
 * `pending`: il bottone sta lavorando (invio di una server action, upload…).
 *
 * ⚠️ **Perché non basta `disabled`.** Prima l'unico segnale era `disabled:opacity-40`, ma
 * i form disabilitano il Salva **anche quando mancano campi obbligatori**: "sto salvando" e
 * "non hai finito di compilare" avevano lo stesso identico aspetto, cioè sbiadito. In
 * collaudo l'utente ha riferito che premendo Salva "la pagina restava statica" — era questo.
 *
 * Con `pending` il bottone resta a piena opacità e mostra una rotellina: si distingue a
 * colpo d'occhio da un bottone spento perché il form non è pronto. `disabled` viene forzato
 * lo stesso, così un doppio invio resta impossibile.
 */
export default function Button({
  variant = "primary",
  className = "",
  pending = false,
  disabled,
  children,
  ...props
}: { variant?: Variant; pending?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  // `disabled:opacity-40` si aggiunge SOLO quando non stiamo lavorando: sovrascriverlo con
  // un'altra utility di opacità sarebbe una gara di specificità che dipende dall'ordine in
  // cui Tailwind genera il CSS, non dall'ordine delle classi qui.
  const sbiadisci = pending ? "" : "disabled:opacity-40";

  return (
    <button
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-mono font-bold text-xs uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:pointer-events-none ${sbiadisci} ${styles[variant]} ${className}`}
      {...props}
    >
      {pending && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
