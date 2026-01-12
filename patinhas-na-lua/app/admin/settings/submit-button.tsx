"use client";

import { useFormStatus } from "react-dom";

export default function SubmitSettingsButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition shadow-lg disabled:opacity-50 flex items-center gap-2"
    >
      {pending ? (
        <>
            <span className="animate-spin">⏳</span> A Guardar...
        </>
      ) : (
        "Guardar Alterações"
      )}
    </button>
  );
}
