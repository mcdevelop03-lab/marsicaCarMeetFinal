"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

export type AuthState = { error?: string; success?: string };

export default function AuthForm({
  action,
  title,
  submitLabel,
  children,
  footer,
  successCta,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  title: string;
  submitLabel: string;
  children: React.ReactNode;
  // Contenuto extra sotto al form (es. "Continua con Google" + link).
  // Viene nascosto insieme al form quando l'azione va a buon fine.
  footer?: React.ReactNode;
  // Call-to-action mostrata sotto al messaggio di successo (es. link al login).
  successCta?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  // Il submit è abilitato solo quando TUTTI i campi del form sono validi
  // (validazione nativa: required + pattern email + minLength password).
  const [formValid, setFormValid] = useState(false);
  const revalidate = () => setFormValid(formRef.current?.checkValidity() ?? false);
  useEffect(revalidate, []);

  // Successo: sostituisce campi e footer con il solo messaggio, così l'utente
  // non ripopola i campi e non ri-invia.
  if (state.success) {
    return (
      <div className="w-full space-y-5">
        <SectionHeading>{title}</SectionHeading>
        <p className="text-sm font-mono text-accent-orange">{state.success}</p>
        {successCta}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <form ref={formRef} action={formAction} onInput={revalidate} className="space-y-5">
        <SectionHeading>{title}</SectionHeading>
        {children}
        {state.error && (
          <p className="text-xs font-mono text-accent-red">{state.error}</p>
        )}
        <Button type="submit" disabled={pending || !formValid} className="w-full">
          {submitLabel}
        </Button>
      </form>
      {footer}
    </div>
  );
}
