"use client";
import { useActionState } from "react";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

export type AuthState = { error?: string; success?: string };

export default function AuthForm({
  action,
  title,
  submitLabel,
  children,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  title: string;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="max-w-sm space-y-6">
      <SectionHeading>{title}</SectionHeading>
      {children}
      {state.error && (
        <p className="text-xs font-mono text-accent-red">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs font-mono text-accent-orange">{state.success}</p>
      )}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
