"use client";

import { ReactNode, useState } from "react";

interface DeleteFormProps {
  id: string;
  action: (formData: FormData) => void;
  className?: string;
  children?: ReactNode;
}

export default function DeleteForm({ id, action, className, children }: DeleteFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 1. THE TRIGGER BUTTON (Just opens the popup) */}
      <button 
        type="button" 
        onClick={() => setIsOpen(true)} 
        className={className}
      >
        {children || "Apagar"}
      </button>

      {/* 2. THE CUSTOM POPUP (Only shows if isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          
          {/* Backdrop (Dark Background) */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} // Close if clicking outside
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
            
            {/* Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Tem a certeza?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação vai eliminar o registo permanentemente. Não é possível recuperar depois.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              
              {/* THE REAL FORM SUBMISSION HAPPENS HERE */}
              <form action={action} className="flex-1">
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition shadow-sm"
                >
                  Sim, Apagar
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
}