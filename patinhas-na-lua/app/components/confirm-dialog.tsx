"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
}

/**
 * A confirmation dialog wrapper that shows a modal before executing the action.
 * Wrap any button/trigger with this component.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  onConfirm,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      // Error handling should be done by the caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger - renders the children and opens modal on click */}
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {children}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-100">
              <span className="text-2xl">
                {variant === "danger" ? "⚠️" : variant === "warning" ? "⚡" : "ℹ️"}
              </span>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              {title}
            </h3>
            <p className="text-gray-500 text-center mb-6">{message}</p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 py-3 px-4 text-white font-bold rounded-lg transition disabled:opacity-50 ${variantStyles[variant]}`}
              >
                {loading ? "A processar..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
