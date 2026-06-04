import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-[#020202]/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl z-10"
          >
            {/* Warning icon badge */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                isDanger 
                  ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white text-base font-extrabold tracking-tight">{title}</h3>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-bold">Solicitação de Confirmação</span>
              </div>
            </div>

            {/* Message Body */}
            <div className="mb-6">
              <p className="text-zinc-300 text-xs leading-relaxed">{message}</p>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-900 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-2 px-4 rounded-xl text-xs font-bold transition border border-zinc-800 hover:text-white"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                }}
                className={`py-2 px-5 rounded-xl text-xs font-extrabold transition text-black ${
                  isDanger 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
