"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { loginAction, type LoginState } from "@/app/admin/_actions/auth";
import { Field, inputClass } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const uid = useId();
  const errorId = `${uid}-error`;
  const [state, formAction] = useActionState(loginAction, initialState);
  const errorRef = useRef<HTMLDivElement>(null);

  // Move focus to the message so a screen reader user is told the attempt
  // failed, matching the public enquiry form's behaviour.
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  const failed = Boolean(state.error);

  // Both fields point at the one form-level message. The server cannot say
  // which field was wrong without leaking whether the account exists, so a
  // per-field error would be a lie.
  const fieldProps = {
    "aria-invalid": failed,
    "aria-describedby": failed ? errorId : undefined,
  };

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <div
          ref={errorRef}
          id={errorId}
          tabIndex={-1}
          role="alert"
          className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900 outline-none"
        >
          {state.error}
        </div>
      ) : null}

      <Field id={`${uid}-email`} label="Email">
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          maxLength={200}
          className={inputClass(failed)}
          placeholder="you@sssacademy.in"
          {...fieldProps}
        />
      </Field>

      <Field id={`${uid}-password`} label="Password">
        <input
          id={`${uid}-password`}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={200}
          className={inputClass(failed)}
          placeholder="••••••••"
          {...fieldProps}
        />
      </Field>

      <SubmitButton size="lg" pendingLabel="Signing in…" className="mt-1 w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
