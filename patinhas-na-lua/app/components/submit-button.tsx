"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
}

/**
 * A submit button that shows loading state when the form is submitting.
 * Must be used inside a <form> element.
 */
export default function SubmitButton({ 
  children, 
  className = "", 
  loadingText = "A processar..." 
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`disabled:opacity-70 disabled:cursor-not-allowed transition ${className}`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
