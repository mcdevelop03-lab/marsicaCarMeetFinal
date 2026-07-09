"use client";
import { InputHTMLAttributes, useState } from "react";
import Input from "@/components/ui/Input";

// Input con hint di validazione "live": la scritta sotto al campo resta visibile
// finché la regola non è soddisfatta, poi sparisce. La regola arriva come stringa
// (non come funzione) così il componente è usabile dalle pagine server.
// Aggiunge anche i vincoli NATIVI equivalenti (pattern/minLength) così la validità
// del form (usata per abilitare il submit in AuthForm) resta coerente con l'hint.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_PATTERN = "[^@\\s]+@[^@\\s]+\\.[^@\\s]+";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  hint: string;
  rule: "email" | "minLength";
  min?: number;
};

export default function ValidatedInput({ hint, rule, min = 8, ...props }: Props) {
  const [value, setValue] = useState("");
  const valid = rule === "email" ? EMAIL_RE.test(value) : value.length >= min;
  const nativeProps = rule === "email" ? { pattern: EMAIL_PATTERN } : { minLength: min };

  return (
    <div className="space-y-1.5">
      <Input {...props} {...nativeProps} onChange={(e) => setValue(e.target.value)} />
      {!valid && <p className="text-[11px] font-mono text-white/40">{hint}</p>}
    </div>
  );
}
