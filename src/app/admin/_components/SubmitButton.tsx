"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";

/**
 * Submit button that disables itself while the enclosing form action is in
 * flight. `useFormStatus` reads the parent form's state, so this must be a
 * child of the `<form>` rather than the component that owns it.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  size = "md",
  className,
  formAction,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      formAction={formAction}
      name={name}
      value={value}
    >
      {pending ? (
        <>
          <Spinner /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 animate-spin" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M10 3a7 7 0 0 1 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
